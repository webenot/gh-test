import {
  CustomCheckoutProvider, Elements,
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
  PaymentElement,
  useCustomCheckout,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLIC_KEY as string,
  { betas: ['custom_checkout_beta_2'] },
);

/**
 * Embedded form in iFrame
 * @constructor
 */
// const CheckoutForm = () => {
//   const navigate = useNavigate();
//
//   const [session, setSession] = useState<any>(null);
//   const [completed, setCompleted] = useState(false);
//
//   useEffect(() => {
//     if (completed) {
//       navigate('/return?session_id=' + session.id, { replace: true });
//     }
//   }, [completed]);
//
//   const fetchClientSecret = useCallback(() => {
//     // Create a Checkout Session
//     return fetch('http://localhost:3001/session')
//       .then((res) => res.json())
//       .then((data) => {
//         console.log(data);
//         setSession(data);
//         return data.client_secret;
//       });
//   }, []);
//
//   const handleComplete = () => {
//     setCompleted(true);
//   };
//
//   const options = {
//     fetchClientSecret,
//     onComplete: handleComplete,
//   };
//
//   return (
//     <>
//       <h1>Test</h1>
//       <div id="checkout">
//         <EmbeddedCheckoutProvider
//           stripe={stripePromise}
//           options={options}
//         >
//           <EmbeddedCheckout />
//         </EmbeddedCheckoutProvider>
//       </div>
//       <a type="button" href="/cancel">Cancel</a>
//     </>
//   )
// };

const CustomCheckout = () => {
  const checkout = useCustomCheckout();
  console.log(checkout);
  return (
    <form>
      <PaymentElement options={{ layout: 'accordion' }}/>
    </form>
  );
};

const CustomCheckout2 = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: any) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const result = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: 'https://example.com/order/123/complete',
      },
    });

    if (result.error) {
      // Show error to your customer (for example, payment details incomplete)
      console.log(result.error.message);
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement/>
      <button disabled={!stripe}>Submit</button>
    </form>
  );
};

/**
 * Not working
 * @param clientSecret
 * @constructor
 */
// const CheckoutProvider = ({ clientSecret }: any) => {
//   return (
//     <CustomCheckoutProvider
//       stripe={stripePromise}
//       options={{ clientSecret }}
//     >
//       <CheckoutForm />
//     </CustomCheckoutProvider>
//   );
// }

/**
 * Not working
 * @constructor
 */
// const CustomCheckoutForm = () => {
//   const [clientSecret, setClientSecret] = useState('')
//   useEffect( () => {
//     // Create a Checkout Session
//     fetch('http://localhost:3001/session')
//       .then((res) => res.json())
//       .then((data) => {
//         console.log({ data });
//         setClientSecret(data.client_secret);
//       })
//       .catch(console.log);
//   }, []);
//
//   return (
//     <>
//       <h1>Test</h1>
//       <div id="checkout">
//         {clientSecret ? (<CheckoutProvider clientSecret={clientSecret} />) : <h2>Loading...</h2>}
//       </div>
//       <a type="button" href="/cancel">Cancel</a>
//     </>
//   )
// };

const Return = () => {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');
    console.log({ sessionId });
    fetch(`http://localhost:3001/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Return', data);
        setStatus(data.status);
        setCustomerEmail(data.customer_email);

        fetch(`http://localhost:3001/subscription?id=${data.subscription}`)
          .then((res) => res.json())
          .then((data) => {
            console.log('subscription', data);
            setSubscription(data);
          })
          .catch(console.log);
      })
      .catch(console.log);
  }, []);

  if (subscription && subscription.status === 'active') {
    return (
      <h1>{subscription.plan.product.name} activated</h1>
    );
  }

  if (status === 'open') {
    return (
      <Navigate to="/checkout"/>
    );
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
          We appreciate your business! A confirmation email will be sent to {customerEmail}.

          If you have any questions, please email <a href="mailto:orders@example.com">orders@example.com</a>.
        </p>
      </section>
    );
  }

  return (
    <h1>Waiting...</h1>
  );
};

const Complete = () => {
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const subId = urlParams.get('subId');
    const redirect_status = urlParams.get('redirect_status');
    console.log({ subId, redirect_status });
    fetch(`http://localhost:3001/subscription?id=${subId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Complete', data);
        setSubscription(data);
      })
      .catch(console.log);
  }, []);

  if (subscription && subscription.status === 'active') {
    return (
      <h1>{subscription.plan.product.name} activated</h1>
    );
  }

  return (
    <h1>Waiting...</h1>
  );
}

const Cancel = () => {
  return (
    <h1>Cancelled</h1>
  );
};

const MainPage = () => {
  return (
    <>
      <h1>Main</h1>
      <ul>
        <li><a href="/checkout">Checkout</a></li>
        {/*<li><a href="/custom-checkout">Custom Checkout</a></li>*/}
        <li><a href="/payment-element">Payment Element</a></li>
        <li><a href="/upgrade">Upgrade</a></li>
      </ul>
    </>
  );
};

const Upgrade = () => {
  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    fetch(`http://localhost:3001/subscription`)
      .then((res) => res.json())
      .then((data) => {
        console.log('subscription for upgrade', data);
      });

    fetch(`http://localhost:3001/proration`)
      .then((res) => res.json())
      .then((data) => {
        console.log('proration', data);
      });
  }, []);

  const handleUpgrade = useCallback((event: any) => {
    event.preventDefault();
    fetch(`http://localhost:3001/upgrade`)
      .then((res) => res.json())
      .then((data) => {
        console.log('upgrade', data);
      });
  }, []);

  return (
    <>
      <h1>Upgrade</h1>
      <button onClick={handleUpgrade}>Upgrade</button>
    </>
  );
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState();
  const [loading, setLoading] = useState(false);

  const handleError = (error: any) => {
    setLoading(false);
    setErrorMessage(error.message);
    console.log(error);
  };

  const handleSubmit = useCallback(async (event: any) => {
    event.preventDefault();
    console.log(event);
    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    console.log('elements', elements);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      handleError(submitError);
      return;
    }
    // Create the subscription
    const res = await fetch('http://localhost:3001/subscription', {
      method: 'POST',
    });
    const { type, clientSecret, id, status } = await res.json();
    console.log({ type, clientSecret, id, status });
    const confirmIntent = type === 'setup' ? stripe.confirmSetup : stripe.confirmPayment;

    // Confirm the Intent using the details collected by the Payment Element
    const { error } = await confirmIntent({
      elements,
      clientSecret,
      confirmParams: {
        return_url: 'http://localhost:3000/complete?subId=' + id,
      },
    });

    if (error) {
      // This point is only reached if there's an immediate error when confirming the Intent.
      // Show the error to your customer (for example, "payment details incomplete").
      handleError(error);
    } else {
      // Your customer is redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer is redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  }, [stripe, elements]);
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement/>
      <button>Submit</button>
    </form>
  );
};

const PaymentElementSubscription = () => {
  const options = {
    mode: 'subscription' as any,
    amount: 500,
    currency: 'usd',
    // Fully customizable with appearance API.
    appearance: {/*...*/ },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm/>
    </Elements>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage/>}/>
        {/*Works - Embedded form in iFrame */}
        {/*<Route path="/checkout" element={<CheckoutForm />} />*/}
        {/*Not working */}
        {/*<Route path="/custom-checkout" element={<CustomCheckoutForm />} />*/}
        <Route path="/payment-element" element={<PaymentElementSubscription/>}/>
        {/*<Route path="/upgrade" element={<Upgrade />} />*/}
        <Route path="/cancel" element={<Cancel/>}/>
        <Route path="/complete" element={<Complete />}/>
        <Route path="/return" element={<Return/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
