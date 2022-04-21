import React, { useEffect, useState } from 'react';
import { connect, WalletConnection, utils, Contract } from 'near-api-js';
import { getConfig } from './config';

const {
  format: { formatNearAmount },
} = utils;

const App = () => {
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [counter, setCounter] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [balance, setBalance] = useState('');

  useEffect(() => {
    connect(getConfig()).then((near) => setWallet(new WalletConnection(near)));
  }, []);

  useEffect(() => {
    if (wallet) {
      setContract(
        new Contract(wallet.account(), 'counter.testnet', {
          viewMethods: ['getCounter'],
          changeMethods: [
            'resetCounter',
            'incrementCounter',
            'decrementCounter',
          ],
        })
      );

      wallet
        .account()
        .getAccountBalance()
        .then(({ available }) => setBalance(available));
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet && wallet.isSignedIn() && contract) {
      contract.getCounter().then((counter) => {
        setCounter(counter);
      });
    }
  }, [wallet, contract]);

  const handleLogin = () => {
    wallet.requestSignIn({
      contractId: 'counter.testnet',
      methodNames: [
        'resetCounter',
        'incrementCounter',
        'decrementCounter',
        'getCounter',
      ],
    });
  };

  const handleReset = async () => {
    await contract.resetCounter({
      args: {},
      amount: deposit.toFixed(0),
    });

    setCounter(await contract.getCounter());
  };

  const handleIncrement = async () => {
    await contract.incrementCounter({
      args: { value: 1 },
      amount: deposit.toFixed(0),
    });

    setCounter(await contract.getCounter());
  };

  const handleDecrement = async () => {
    await contract.decrementCounter({
      args: { value: 1 },
      amount: deposit.toFixed(0),
    });

    setCounter(await contract.getCounter());
  };

  return (
    <section>
      <h1>🎉 Congrats on starting your NEAR journey in React! 🎉</h1>
      {wallet && wallet.isSignedIn() ? (
        <div>
          <div>Hi, {wallet.getAccountId()}!</div>
          <p>
            Your account ballance is{' '}
            <strong>{formatNearAmount(balance, 4)}</strong>
          </p>
          <p>
            The current value of the counter is: <strong>{counter}</strong>
          </p>
          <label htmlFor="deposit">
            <span>Deposit value (in yoctoNEAR): </span>
            <input
              id="deposit"
              type="number"
              min={1}
              value={deposit}
              onChange={({ target: { value } }) => setDeposit(parseInt(value))}
            />
          </label>
          <div
            style={{ display: 'flex', flexDirection: 'column', width: '50%' }}
          >
            <button onClick={() => handleReset()}>Reset Counter</button>
            <button onClick={() => handleIncrement()}>Increment counter</button>
            <button onClick={() => handleDecrement()}>Decrement counter</button>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => handleLogin()}>Login with NEAR</button>
        </div>
      )}
    </section>
  );
};

export default App;
