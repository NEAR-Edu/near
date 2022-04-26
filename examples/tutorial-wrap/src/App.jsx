import React, { useEffect, useState } from 'react';
import { connect, WalletConnection, utils, Contract } from 'near-api-js';
import { getConfig } from './config';

const {
  format: { parseNearAmount, formatNearAmount },
} = utils;

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState(0);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState(null);
  const [method, setMethod] = useState('wrap');

  useEffect(() => {
    connect(getConfig()).then((near) => setWallet(new WalletConnection(near)));
  }, []);

  useEffect(() => {
    if (wallet) {
      setContract(
        new Contract(wallet.account(), 'wrap.testnet', {
          changeMethods: ['near_deposit', 'near_withdraw'],
          viewMethods: ['ft_balance_of'],
        })
      );
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet && wallet.isSignedIn() && contract) {
      contract
        .ft_balance_of({ account_id: wallet.getAccountId() })
        .then((balance) => setBalance(formatNearAmount(balance)));
    }
  }, [wallet, contract]);

  const handleLogin = () => {
    wallet.requestSignIn({
      contractId: 'wrap.testnet',
      methodNames: ['near_deposit', 'ft_balance_of', 'near_withdraw'],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (method === 'wrap') {
      await contract.near_deposit({
        args: {},
        amount: parseNearAmount(amount),
      });
    }

    if (method === 'unwrap') {
      await contract.near_withdraw({
        args: {
          amount: parseNearAmount(amount),
        },
        amount: 1,
      });
    }
  };

  return (
    <div>
      <button onClick={() => handleLogin()}>Login with NEAR</button>
      <p>Current Wrapped Balance: {balance}</p>
      <form onSubmit={handleSubmit}>
        <select
          defaultValue={method}
          onChange={({ target: { value } }) => setMethod(value)}
        >
          <option value="wrap">Wrap NEAR</option>
          <option value="unwrap">Unwrap NEAR</option>
        </select>
        <label>
          Amount:
          <input
            type="number"
            name="deposit"
            value={amount}
            onChange={({ target: { value } }) => setAmount(value)}
          />
        </label>
        <input
          type="submit"
          value={`${method} NEAR`}
          style={{ textTransform: 'capitalize' }}
        />
      </form>
    </div>
  );
}
