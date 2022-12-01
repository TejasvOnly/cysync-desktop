import React, { useEffect, useRef } from 'react';

import logger from '../../utils/logger';
import { useNetwork } from '../provider';
import { SyncQueueItem } from '../provider/syncProvider/types';

export interface UseSyncQueueInterface {
  BATCH_SIZE: number;
  syncQueue: SyncQueueItem[];
  setSyncQueue: React.Dispatch<React.SetStateAction<SyncQueueItem[]>>;
  queueExecuteInterval: number;
  modulesInExecutionQueue: string[];
  setModuleInExecutionQueue: React.Dispatch<React.SetStateAction<string[]>>;
  addToQueue: (item: SyncQueueItem) => void;
  connected: boolean;
  connectedRef: React.MutableRefObject<boolean>;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialSetupDone: boolean;
  setInitialSetupDone: React.Dispatch<React.SetStateAction<boolean>>;
  isWaitingForConnection: boolean;
  isExecutingTask: boolean;
  setIsExecutingTask: React.Dispatch<React.SetStateAction<boolean>>;
}

export type UseSyncQueue = (executeInterval: number) => UseSyncQueueInterface;

export const useSyncQueue: UseSyncQueue = (executeInterval: number) => {
  const BATCH_SIZE = 5;
  const [syncQueue, setSyncQueue] = React.useState<SyncQueueItem[]>([]);
  const [modulesInExecutionQueue, setModuleInExecutionQueue] = React.useState<
    string[]
  >([]);

  const [isExecutingTask, setIsExecutingTask] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isWaitingForConnection, setWaitingForConnection] =
    React.useState(false);
  const [isInitialSetupDone, setInitialSetupDone] = React.useState(false);

  const queueExecuteInterval = executeInterval;

  const { connected } = useNetwork();
  const connectedRef = useRef<boolean | null>(connected);

  const timeThreshold = 60000; // log every 1 minute
  const offsetTime = useRef(0);
  const startTime = useRef(0);

  const addToQueue = (item: SyncQueueItem) => {
    setSyncQueue(currentSyncQueue => {
      if (currentSyncQueue.findIndex(elem => elem.equals(item)) === -1) {
        // Adds the current item to ModuleExecutionQueue
        setModuleInExecutionQueue(currentModuleQueue => {
          if (!currentModuleQueue.includes(item.module)) {
            return [...currentModuleQueue, item.module];
          }
          return currentModuleQueue;
        });

        return [...currentSyncQueue, item];
      }
      return currentSyncQueue;
    });
  };

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  // Sets if the sync is 'on' or 'off'
  useEffect(() => {
    if (syncQueue.length > 0) {
      if (connected && isInitialSetupDone) {
        if (isWaitingForConnection) {
          setWaitingForConnection(false);
        }

        setIsSyncing(true);
      } else if (isInitialSetupDone) {
        setWaitingForConnection(true);
      }
    } else {
      setIsSyncing(false);
    }
  }, [connected, isInitialSetupDone, syncQueue]);

  // queue execution performance logging
  useEffect(() => {
    if (syncQueue.length > 0) {
      if (startTime.current > 0) {
        const peek = performance.now();
        if (peek - startTime.current > timeThreshold + offsetTime.current) {
          offsetTime.current = peek;
          logger.info(`Threshold exceeded at ${peek} milliseconds`);
          logger.info({
            queue: syncQueue.slice(0, 3).map(item => {
              return {
                ...item,
                walletId: undefined,
                xpub: undefined,
                zpub: undefined
              };
            }),
            totalLength: syncQueue.length
          });
        }
      } else {
        startTime.current = performance.now();
        logger.info(
          `Sync queue started executing with ${syncQueue.length} items`
        );
      }
    } else {
      if (startTime.current > 0) {
        const stop = performance.now();
        logger.info(
          `Sync completed total time: ${stop - startTime.current} milliseconds`
        );
        offsetTime.current = 0;
        startTime.current = 0;
      }
    }
  }, [syncQueue]);

  return {
    BATCH_SIZE,
    queueExecuteInterval,
    connected,
    connectedRef,
    isSyncing,
    setIsSyncing,
    isExecutingTask,
    setIsExecutingTask,
    isInitialSetupDone,
    setInitialSetupDone,
    isWaitingForConnection,
    syncQueue,
    setSyncQueue,
    modulesInExecutionQueue,
    setModuleInExecutionQueue,
    addToQueue
  } as UseSyncQueueInterface;
};
