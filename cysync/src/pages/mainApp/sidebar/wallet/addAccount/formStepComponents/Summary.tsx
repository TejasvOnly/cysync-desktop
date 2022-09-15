import { COINS, NearCoinData } from '@cypherock/communication';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import ErrorDialog from '../../../../../../designSystem/designComponents/dialog/errorDialog';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Backdrop from '../../../../../../designSystem/genericComponents/Backdrop';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import { coinDb, customAccountDb } from '../../../../../../store/database';
import { broadcastTxn } from '../../../../../../store/hooks/flows';
import {
  useCurrentCoin,
  useNetwork,
  useSelectedWallet,
  useSendTransactionContext,
  useSync,
  useTokenContext
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';
import logger from '../../../../../../utils/logger';
import LabelText from '../../send/generalComponents/LabelText';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletAddAccountSummary';

const classes = {
  root: `${PREFIX}-root`,
  summaryDetails: `${PREFIX}-summaryDetails`,
  mainText: `${PREFIX}-mainText`,
  divider: `${PREFIX}-divider`,
  footer: `${PREFIX}-footer`,
  deviceContinueButton: `${PREFIX}-deviceContinueButton`,
  center: `${PREFIX}-center`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.summaryDetails}`]: {
    width: '70%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '15rem'
  },
  [`& .${classes.mainText}`]: {
    fontSize: '1.2rem',
    color: theme.palette.primary.light,
    marginBottom: '0.5rem'
  },
  [`& .${classes.divider}`]: {
    width: '100%',
    borderTop: `1px solid ${theme.palette.text.secondary}`
  },
  [`& .${classes.footer}`]: {
    display: 'flex',
    alignItems: 'flex-end',
    width: '85%',
    justifyContent: 'flex-end'
  },
  [`& .${classes.deviceContinueButton}`]: {
    width: '10rem',
    height: '3rem',
    marginTop: 15,
    textTransform: 'none',
    color: '#fff'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}));

const Summary: React.FC<StepComponentProps> = ({
  handleNext,
  recipientData,
  creatorAccount,
  handleClose
}) => {
  const [broadcastError, setBroadcastError] = useState('');
  const [advanceError, setAdvanceError] = useState('');

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();
  const coinNetwork = (COINS[coinDetails.slug] as NearCoinData).network;
  const nearSuffix = coinNetwork === 'testnet' ? '.testnet' : '.near';

  const { token } = useTokenContext();

  const { connected } = useNetwork();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const { sendTransaction } = useSendTransactionContext();

  const [open, setOpen] = useState(false);
  const { addBalanceSyncItemFromCoin } = useSync();

  const handleSend = () => {
    setOpen(true);
    setBroadcastError('');
    setAdvanceError('');
    broadcastTxn(sendTransaction.signedTxn, coinDetails.slug)
      .then(res => {
        setOpen(false);
        sendTransaction.setHash(res);
        sendTransaction.onAddAccountTxnBroadcast({
          walletId: selectedWallet._id,
          coin: coinDetails.slug,
          txHash: res
        });
        (async () => {
          try {
            const coins = await coinDb.getAll({
              walletId: coinDetails.walletId,
              slug: coinDetails.slug
            });
            if (coins.length < 1) throw new Error('No coins found');
            const data = {
              name: recipientData[0].recipient + nearSuffix,
              walletId: coinDetails.walletId,
              coin: coinDetails.slug,
              price: coinDetails.price.toString(),
              balance: '0'
            };
            await customAccountDb.insert(data);
            addBalanceSyncItemFromCoin(coins[0], {});
          } catch (error) {
            logger.error('Custom Account database update failed', error);
          }
        })();
        handleNext();
        Analytics.Instance.event(
          Analytics.Categories.SEND_TXN,
          Analytics.Actions.COMPLETED,
          coinAbbr
        );
        return null;
      })
      .catch(e => {
        setOpen(false);
        logger.error('Transaction broadcast error', e);
        if (e.isAxiosError) {
          if (e.response) {
            if (e.response.data && e.response.data.cysyncError) {
              setAdvanceError(e.response.data.cysyncError);
            }
            if (selectedWallet.passphraseSet) {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime.\nThis may be due to incorrect passphrase.'
              );
            } else {
              setBroadcastError(
                'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime.'
              );
            }
          } else {
            setBroadcastError(
              'Failed to broadcast the transaction. Check your internet connection and try again.'
            );
          }
        } else {
          setBroadcastError(
            'Some error occurred while broadcasting the transaction\nNo Funds have been deducted from your wallet account\nTry again in sometime.'
          );
        }
        Analytics.Instance.event(
          Analytics.Categories.SEND_TXN,
          Analytics.Actions.BROADCAST_ERROR,
          coinAbbr
        );
      });
  };

  const handleRetry = () => {
    Analytics.Instance.event(
      Analytics.Categories.SEND_TXN,
      Analytics.Actions.RETRY,
      coinAbbr
    );
    logger.info('Send transaction retry');
    handleSend();
  };

  return (
    <Root className={classes.root}>
      {broadcastError && (
        <ErrorDialog
          open={!!broadcastError}
          handleClose={() => handleClose(true)}
          actionText="Retry"
          handleAction={handleRetry}
          text={broadcastError}
          advanceText={advanceError}
          flow="Broadcasting Transaction"
        />
      )}
      <Backdrop open={open} />

      <div className={classes.summaryDetails}>
        <Typography
          color="textSecondary"
          variant="h5"
          style={{ marginBottom: '0.5rem' }}
        >
          The new account is successfully verified. You may now complete account
          creation
        </Typography>
        {coinAbbr.toUpperCase() === 'ETHR' && (
          <Typography color="error" style={{ marginBottom: '0.5rem' }}>
            [ This is a Ropsten
            <strong>&nbsp;Testnet&nbsp;</strong>
            transaction only ]
          </Typography>
        )}
        <LabelText label="Create From" text={creatorAccount} verified />
        <LabelText
          label="New Account Id"
          text={recipientData[0].recipient + nearSuffix}
          verified
        />
        <LabelText
          label="Amount"
          text={`~ ${0.1} ${coinDetails.slug.toUpperCase()} ( $${formatDisplayAmount(
            0.1 * parseFloat(coinDetails.displayPrice),
            2,
            true
          )})`}
          verified={sendTransaction.verified}
        />
        <LabelText
          label="Transaction Fee"
          text={`~ ${0.0012} ${coinDetails.slug.toUpperCase()} ~( $${formatDisplayAmount(
            0.0012 * parseFloat(coinDetails.displayPrice),
            2,
            true
          )})`}
          verified
        />
        {connected || (
          <div style={{ marginTop: '10px' }} className={classes.center}>
            <Icon
              size={50}
              viewBox="0 0 60 60"
              iconGroup={<ErrorExclamation />}
            />
            <Typography variant="body2" color="secondary">
              Internet connection is required for this action
            </Typography>
          </div>
        )}
      </div>
      <div className={classes.divider} />
      <div className={classes.footer}>
        <Tooltip title={connected ? '' : 'No internet connection available'}>
          <div style={{ display: 'inline-block' }}>
            <CustomButton
              className={classes.deviceContinueButton}
              onClick={handleSend}
              disabled={!sendTransaction.signedTxn || !connected}
            >
              Create Account
            </CustomButton>
          </div>
        </Tooltip>
      </div>
    </Root>
  );
};

Summary.propTypes = StepComponentPropTypes;

export default Summary;
