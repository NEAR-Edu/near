# Create React App NEAR Template

This template is used to create a NEAR front-end using [Create React App](https://create-react-app.dev/). It comes with [near-api-js](https://github.com/near/near-api-js).

## Getting Started

To get started use this template with [Create React App](https://create-react-app.dev/)

```shell
npx create-react-app --template near-js my-app
```

## Usage Tutorial

In this tutorial you will learn how to use `near-api-js` to interact with the blockchain in React applications.
We will interact with the `wrap` contract for NEAR tokens. The contract allows us to wrap `NEAR` tokens into `wNEAR` (essentialy minting a different kind of fungible token).
Wrapping tokens is a way of representing a cryptocurrency from another blockchain, or any other asset, in the original currency (pegging the to the value of the other asset). The wrapped token allows the asset to be used on the original blockchain for using that blockchains functionality, while preserving the original value making it possible to later trade the wrapped token for the original asset.

**Note**: If you would like to explore wrapped tokens in more detail, you can check out [this article](https://academy.binance.com/en/articles/what-are-wrapped-tokens) by [Binance Academy](https://academy.binance.com/).

The tutorial will cover the basic usages of `near-api-js` like wallet connection, querying state in the blockchain and calling both `view` and `change` methods of smart contracts.

You can find the finished tutorial app [here](https://github.com/NEAR-Edu/near/tree/main/packages/cra-template-js/examples/tutorial-wrap).

You can also find a CodeSandbox of the tutorial app [here](https://codesandbox.io/s/tutorial-wrap-near-3oqsfx?fontsize=14&hidenavigation=1&theme=dark).

## The steps

The steps we will follow are layed out here:

1. [create a NEAR Account](#1-create-a-near-account)
2. [create a new React app using `cra-template-near-js`](#2-create-a-react-application)
3. [create a landing page for users to sign in](#3-create-a-landing-page)
4. [add a form to the landing page to wrap NEAR](#4-wrap-near-on-form-submit)
5. [display the wrapped NEAR balance](#5-view-wrapped-balance-on-mount)
6. [add an unwrap NEAR feature to the form](#6-unwrap-near-on-form-submit)

### 1. Create a NEAR Account

Checkout the official docs to get started creating a NEAR account [here](https://docs.near.org/docs/develop/basics/create-account).

### 2. Create a React Application

The `cra-template-near-js` Create React App template sets up a React application preconfigured with [near-api-js](https://github.com/near/near-api-js).

To start your project type

```shell
npx create-react-app --template near-js wrap-near-app
```

into a terminal. This will create a new directory `wrap-near-app` based on `cra-template-near-js` (see [Selecting a template](https://create-react-app.dev/docs/getting-started#selecting-a-template)).

### 3. Create a landing page

To create a landing page we'll edit `src/App.jsx` placing a sign in button onto the page.

```jsx {2,8-10,13-16}
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
- **Line 13-16** - request a sign in with the `wrap.testnet` contract (using `near_deposit` and `near_withdraw` methods of the contract).

### 4. Wrap NEAR on form submit

Next we'll add a form to wrap NEAR like in the code below.

First, we will initialize our contract interface inside a `useEffect` hook.
Then, we'll add the form containing an `<input>` element for the amount of NEAR to wrap.

```jsx {2,5-7,11,12,18-26,28,40-43,48-50,51-62}
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
        }),
      );
    }
  }, [wallet]);

  const isSignedIn = Boolean(wallet && wallet.isSignedIn() && contract);

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
      {!isSignedIn && (
        <button onClick={() => handleLogin()}>Login with NEAR</button>
      )}
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

- **Line 2** - import `utils` and `Contract` from [near-api-js](https://github.com/near/near-api-js).
- **Line 5-7** - destructure the `parseNearAmount` function from `utils`.
- **Line 11** - add a `useState` hook to store the NEAR amount.
- **Line 12** - add a `useState` hook to store the contract object.
- **Line 18-26** - define a NEAR smart contract interface
- **Line 28** - add a `isSignedIn` variable to check if the user is logged in.
- **Line 40-43** - call the `near_deposit` method attaching `amount` of NEAR for wrapping
- **Line 48-50** - remove the sign in button if user is signed in.
- **Line 51-62** - form to collect the amount of NEAR to wrap from user input

### 5. View wrapped balance on mount

Now we are going to add balance checking to our app.

We have to update the contract interface to include the `ft_balance_of` method.
We will add a `useEffect` hook to fetch the balance of the wrapped NEAR.
Then we add a `<p>` element to display the balance.

```jsx {6,13,24,34-35,36,61}
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
        }),
      );
    }
  }, [wallet]);

  const isSignedIn = Boolean(wallet && wallet.isSignedIn() && contract);

  useEffect(() => {
    if (isSignedIn) {
      contract
        .ft_balance_of({ account_id: wallet.getAccountId() })
        .then((balance) => setBalance(formatNearAmount(balance)));
    }
  }, [wallet, contract, isSignedIn]);

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
      {!isSignedIn && (
        <button onClick={() => handleLogin()}>Login with NEAR</button>
      )}
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

- **Line 6** - destructure the `formatNearAmount` function from `utils`.
- **Line 13** - add a `useState` hook to store the wNEAR balance.
- **Line 24** - add `ft_balance_of` to the contract interface
- **Line 34-35** - call the `ft_balance_of` method passing the `account_id` argument
- **Line 36** - receive the wrapped NEAR balance and convert yoctoNEAR to NEAR.
- **Line 61** - display the balance

### 6. Unwrap NEAR on form submit

The final piece of the puzzle is allowing the user to also unwrap wNEAR into NEAR.

To add this functionality we need to update the contract interface to include the `near_withdraw` method.
Then we have to add a `<select>` element to allow the user to choose what action they want to perform (`wrap` or `unwrap`).
Finally we have to handle the different cases in our `handleSubmit` function.

```jsx {14,24,51-65,75-82}
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
        }),
      );
    }
  }, [wallet]);

  const isSignedIn = Boolean(wallet && wallet.isSignedIn() && contract);

  useEffect(() => {
    if (isSignedIn) {
      contract
        .ft_balance_of({ account_id: wallet.getAccountId() })
        .then((balance) => setBalance(formatNearAmount(balance)));
    }
  }, [wallet, contract, isSignedIn]);

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
      {!isSignedIn && (
        <button onClick={() => handleLogin()}>Login with NEAR</button>
      )}
      <p>Current Wrapped Balance: {balance}</p>
      <form onSubmit={handleSubmit}>
        <select
          defaultValue={method}
          onChange={({ target: { value } }) => setMethod(value)}
          style={{ marginRight: '1rem' }}
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

- **Line 14** - add a `useState` hook to store the method.
- **Line 24** - add `near_withdraw` to the contract interface
- **Line 51-65** - check if wrap or unwrap is selected then call either `near_deposit` or `near_withdraw`
- **Line 75-82** - add select input to form to allow method selection
