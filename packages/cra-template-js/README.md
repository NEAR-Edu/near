# Create React App NEAR Template

This template is used to create a NEAR front-end using [Create React App](https://create-react-app.dev/). It comes with [near-api-js](https://github.com/near/near-api-js).

## Getting Started

To get started use this template with [Create React App](https://create-react-app.dev/) `npx create-react-app --template near-js my-app`.

## Usage Tutorial

1. create a NEAR Account
2. create a new React app using `cra-template-near-js`
3. create a landing page for users to sign in
4. add a form to the landing page to wrap NEAR
5. display the wrapped NEAR balance
6. add an unwrap NEAR feature to the form

### 1. Create a NEAR Account

Checkout the official docs to get started creating a NEAR account [here](https://docs.near.org/docs/develop/basics/create-account).

### 2. Create a React Application

The `cra-template-near-js` Create React App template sets up a React application preconfigured with [near-api-js](https://github.com/near/near-api-js).

To start your project type `npx create-react-app --template near-js wrap-near-app` into a terminal. This will create a new directory `wrap-near-app` based on `cra-template-near-js` (see [Selecting a template](https://create-react-app.dev/docs/getting-started#selecting-a-template)).

### 3. Create a landing page

To create a landing page we'll edit `src/App.jsx` placing a sign in button onto the page.

```jsx
import React, { useEffect, useState } from 'react';
import { connect, WalletConnection } from 'near-api-js';
import { getConfig } from './config';

export default function App() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    connect(getConfig()).then((near) => setWallet(new WalletConnection(near)));
  }, []);

  const handleLogin = () => {
    wallet.requestSignIn({
      contractId: 'wrap.testnet',
      methodNames: [],
    });
  };

  return (
    <div>
      <button onClick={() => handleLogin()}>Login with NEAR</button>
    </div>
  );
}
```

- **Line 2** - import `connect` and `WalletConnection` from [near-api-js](https://github.com/near/near-api-js).
- **Line 8-10** - establish a connection with the NEAR testnet.
- **Line 11-15** - request a sign in with the `wrap.testnet` contract (using `near_deposit` and `near_withdraw` methods of the contract).

### 4. Wrap NEAR on form submit

Next we'll add a form to wrap NEAR.

```jsx
import React, { useEffect, useState } from 'react';
import { connect, WalletConnection, utils, Contract } from 'near-api-js';
import { getConfig } from './config';

const {
  format: { parseNearAmount },
} = utils;

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState(0);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    connect(getConfig()).then((near) => setWallet(new WalletConnection(near)));
  }, []);

  useEffect(() => {
    if (wallet) {
      setContract(
        new Contract(wallet.account(), 'wrap.testnet', {
          changeMethods: ['near_deposit'],
        })
      );
    }
  }, [wallet]);

  const handleLogin = () => {
    wallet.requestSignIn({
      contractId: 'wrap.testnet',
      methodNames: ['near_deposit'],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await contract.near_deposit({
      args: {},
      amount: parseNearAmount(amount),
    });
  };

  return (
    <div>
      <button onClick={() => handleLogin()}>Login with NEAR</button>
      <form onSubmit={handleSubmit}>
        <label>
          Deposit:
          <input
            type="number"
            name="deposit"
            value={amount}
            onChange={({ target: { value } }) => setAmount(value)}
          />
        </label>
        <input type="submit" value="Wrap NEAR" />
      </form>
    </div>
  );
}
```

- **Line 18-26** - define a NEAR smart contract interface
- **Line 47-58** - form to collect the amount of NEAR to wrap from user input
- **Line 35-42** - call the `near_deposit` method attaching `amount` of NEAR for wrapping

### 5. View wrapped balance on mount

```jsx
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

  useEffect(() => {
    connect(getConfig()).then((near) => setWallet(new WalletConnection(near)));
  }, []);

  useEffect(() => {
    if (wallet) {
      setContract(
        new Contract(wallet.account(), 'wrap.testnet', {
          changeMethods: ['near_deposit'],
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
      methodNames: ['near_deposit', 'ft_balance_of'],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await contract.near_deposit({
      args: {},
      amount: parseNearAmount(amount),
    });
  };

  return (
    <div>
      <button onClick={() => handleLogin()}>Login with NEAR</button>
      <p>Current Wrapped Balance: {balance}</p>
      <form onSubmit={handleSubmit}>
        <label>
          Deposit:
          <input
            type="number"
            name="deposit"
            value={amount}
            onChange={({ target: { value } }) => setAmount(value)}
          />
        </label>
        <input type="submit" value="Wrap NEAR" />
      </form>
    </div>
  );
}
```

- **Line 24** - add `ft_balance_of` to the contract interface
- **Line 32-33** - call the `ft_balance_of` method passing the `account_id` argument
- **Line 34** - receive the wrapped NEAR balance and convert yoctoNEAR to NEAR.
- **Line 57** - display the balance

### 6. Unwrap NEAR on form submit

```jsx
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
```

- **Line 24** - add `near_withdraw` to the contract interface
- **Line 49-63** - check if wrap or unwrap is selected then call either `near_deposit` or `near_withdraw`
- **Line 71-78** - add select input to form to allow method selection
