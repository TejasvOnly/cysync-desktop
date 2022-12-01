import { COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import logger from '../../../utils/logger';
import { coinDb, Status, Transaction, transactionDb } from '../../database';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { RESYNC_INTERVAL, sleep, useSync } from '../syncProvider';
import { SyncQueueItem } from '../syncProvider/types';

import { executeBatchCheck, ExecutionResult } from './sync';
import { TxnStatusItem } from './txnStatusItem';

const BATCH_SIZE = 5;

export interface TransactionStatusProviderInterface {
  addTransactionStatusCheckItem: (
    txn: Transaction,
    options?: { isRefresh?: boolean }
  ) => void;
}

export const StatusCheckContext: React.Context<TransactionStatusProviderInterface> =
  React.createContext<TransactionStatusProviderInterface>(
    {} as TransactionStatusProviderInterface
  );

export const TransactionStatusProvider: React.FC = ({ children }) => {
  const { addBalanceSyncItemFromCoin, addHistorySyncItemFromCoin } = useSync();
  const {
    isExecutingTask,
    setIsExecutingTask,
    connected,
    syncQueue,
    setSyncQueue,
    queueExecuteInterval,
    addToQueue
  } = useSyncQueue(2000);

  const backoffExpMultiplier = 2;
  const backoffBaseInterval = 10000;

  const addTransactionStatusCheckItem = (
    txn: Transaction,
    { isRefresh = false }
  ) => {
    const coinData = COINS[txn.coin || txn.slug];

    if (!coinData) {
      logger.warn('Invalid coin found', {
        txn,
        coinType: txn.coin || txn.slug
      });
      return;
    }

    const newItem = new TxnStatusItem({
      walletId: txn.walletId,
      txnHash: txn.hash,
      sender: txn.outputs[0]?.address,
      coinType: coinData.abbr,
      coinGroup: coinData.group,
      module: 'refresh',
      isRefresh,
      backoffTime: backoffBaseInterval
    });
    addToQueue(newItem);
  };

  const updateAllExecutedItems = async (
    executionResults: ExecutionResult[]
  ) => {
    const syncQueueUpdateOperations: Array<{
      item: SyncQueueItem;
      operation: 'remove' | 'update';
      updatedItem?: SyncQueueItem;
    }> = [];

    for (const result of executionResults) {
      const { item } = result;
      let updatedItem;
      let removeFromQueue = true;

      if (
        item instanceof TxnStatusItem &&
        (result.isFailed || !result.isComplete)
      ) {
        updatedItem = item.clone();
        removeFromQueue = false;
        updatedItem.backoffFactor *= backoffExpMultiplier;
        updatedItem.backoffTime =
          updatedItem.backoffFactor * backoffBaseInterval;

        // not very precise; next history sync might be very near in time
        // ineffective in reducing API calls, helpful to shorten the syncQueue
        if (updatedItem.backoffTime > RESYNC_INTERVAL) removeFromQueue = true;
      }

      syncQueueUpdateOperations.push({
        operation: removeFromQueue ? 'remove' : 'update',
        item,
        updatedItem
      });

      // no need for resync as transaction is incomplete; skipping it
      if (result.isComplete !== true || !(item instanceof TxnStatusItem))
        continue;

      try {
        // status is final, resync balances and history
        const coinEntry = await coinDb.getOne({
          walletId: item.walletId,
          slug: item.coinType
        });
        addBalanceSyncItemFromCoin(
          {
            ...coinEntry,
            coinGroup: item.coinGroup,
            parentCoin: item.parentCoin
          },
          {}
        );
        addHistorySyncItemFromCoin(
          {
            ...coinEntry,
            coinGroup: item.coinGroup,
            parentCoin: item.parentCoin
          },
          {}
        );
      } catch (e) {
        logger.error('Failed to sync after transaction status update', e, item);
      }
    }

    setSyncQueue(currentSyncQueue => {
      const duplicate = [...currentSyncQueue];

      for (const operation of syncQueueUpdateOperations) {
        const index = duplicate.findIndex(elem => elem.equals(operation.item));
        if (index === -1) {
          logger.warn('Cannot find item index while updating sync queue');
          continue;
        }

        if (operation.operation === 'remove') {
          duplicate.splice(index, 1);
        } else if (operation.operation === 'update' && operation.updatedItem) {
          duplicate[index] = operation.updatedItem;
        }
      }

      return duplicate;
    });
  };

  // pick, batch and execute the queued request items and finally update the queue
  const executeNextInQueue = async () => {
    setIsExecutingTask(true);

    let items: SyncQueueItem[] = [];

    if (syncQueue.length > 0) {
      // deduct the backoff time
      // this is inaccurate; actual backoff is (backoff + queue processing)
      syncQueue.forEach(ele => {
        if (!(ele instanceof TxnStatusItem)) return;
        ele.backoffTime = Math.max(0, ele.backoffTime - queueExecuteInterval);
      });

      // filter items ready for execution i.e. backoffTime is 0
      items = syncQueue.filter(
        ele =>
          ele instanceof TxnStatusItem &&
          ele.backoffTime <= queueExecuteInterval
      );
    }

    if (connected && syncQueue.length > 0 && items.length > 0) {
      const array = await executeBatchCheck(items.slice(0, BATCH_SIZE));
      await updateAllExecutedItems(
        array.reduce((acc, item) => acc.concat(item), [])
      );
    }

    await sleep(queueExecuteInterval);
    setIsExecutingTask(false);
  };

  // fetch all pending transactions and push them into status check queue
  const setupInitial = async () => {
    logger.info('Sync: Adding Initial items');
    if (process.env.IS_PRODUCTION === 'true') {
      const allPendingTxns = await transactionDb.getAll({
        status: Status.PENDING
      });

      if (allPendingTxns.length === 0) return;

      allPendingTxns.forEach(txnItem => {
        addTransactionStatusCheckItem(txnItem, { isRefresh: true });
      });
    }
  };

  // setup initial pending transaction status check
  useEffect(() => {
    setupInitial();
    transactionDb.failExpiredTxn();
  }, []);

  // execute transaction status checks
  useEffect(() => {
    if (!isExecutingTask) executeNextInQueue();
  }, [isExecutingTask]);

  return (
    <StatusCheckContext.Provider
      value={{
        addTransactionStatusCheckItem
      }}
    >
      {children}
    </StatusCheckContext.Provider>
  );
};

TransactionStatusProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useStatusCheck(): TransactionStatusProviderInterface {
  return React.useContext(StatusCheckContext);
}
