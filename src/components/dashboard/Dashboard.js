import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Header from '../Header/Header';
import './Dashboard.css';

import ugali from '../../assets/ugali.webp';
import rice from '../../assets/wali.webp';
import pilau from '../../assets/pilau.webp';
import chips from '../../assets/chips.webp';
import soda from '../../assets/soda.webp';
import ugaliMeat from '../../assets/ugali_meat.webp';
import ugaliChicken from '../../assets/ugali_chicken.jpg';
import ugaliFish from '../../assets/ugali_fish.webp';
import ugaliUtumbo from '../../assets/ugali_utumbo.webp'
import riceMeat from '../../assets/rice_meat.webp';
import riceChicken from '../../assets/rice_chicken.webp';
import riceUtumbo from '../../assets/rice_utumbo.jpeg';
import riceDagaa from '../../assets/rice_dagaa.jpg';
import riceFish from '../../assets/rice_fish.jpg';
import pilauMeat from '../../assets/pilau_meat.webp';
import pilauChicken from '../../assets/pilau_chicken.webp';
import pilauUtumbo from '../../assets/pilau_utumbo.jpg';
import pilauDagaa from '../../assets/pilau_dagaa.png';
import pilauFish from '../../assets/pilau_fish.webp';
import frenchFries from '../../assets/french_fries.webp';
import friesOmelette from '../../assets/fries_omelette.webp'
import cola from '../../assets/cola.jpeg'; 

const coreFoods = [
  { name: 'Ugali', image: ugali },
  { name: 'Rice', image: rice },
  { name: 'Pilau', image: pilau },
  { name: 'Chips', image: chips },
  { name: 'Soda', image: soda },
];

const subOptions = {
  Ugali: [
    { name: 'Ugali with meat', image: ugaliMeat },
    { name: 'Ugali with chicken', image: ugaliChicken},
    { name: 'Ugali with fish', image: ugaliFish },
    { name: 'Ugali with utumbo', image: ugaliUtumbo},
    
  ],
  Rice: [
    { name: 'Rice with meat', image: riceMeat },
    { name: 'Rice with chicken', image: riceChicken },
    { name: 'Rice with utumbo', image: riceUtumbo },
    { name: 'Rice with dagaa', image: riceDagaa },
    { name: 'Rice with fish', image: riceFish },
  ],
  Pilau: [
    { name: 'Pilau with meat', image: pilauMeat },
    { name: 'Pilau with chicken', image: pilauChicken },
    { name: 'Pilau with utumbo', image: pilauUtumbo },
    { name: 'Pilau with dagaa', image: pilauDagaa},
    { name: 'Pilau with fish', image: pilauFish},
  ],
  Chips: [
    {name: 'French fries', image: frenchFries },
    {name: 'Fries omelette', image: friesOmelette },
  ],
  Soda: [
    { name: 'Cola', image: cola },
  ]
};

function Dashboard() {
  const [userName, setUserName] = useState('');
  const [selectedCore, setSelectedCore] = useState('');
  const [selectedFood, setSelectedFood] = useState('');
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [orderComplete, setOrderComplete] = useState(false);
  const [loadingFood, setLoadingFood] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [lastOrders, setLastOrders] = useState([]);

  // Load user info and last order
  useEffect(() => {
    const fetchUser = async () => {
      const email = auth.currentUser?.email;
      if (!email) return;

      const firstName = email.split('@')[0];
      setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));

      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setSelectedFood(data.selectedFood || '');
        const core = coreFoods.find(c => data.selectedFood?.startsWith(c.name));
        if (core) setSelectedCore(core.name);

        // Track order time and lock
        if (data.selectionTime) {
          const selectedTime = new Date(data.selectionTime);
          const now = new Date();
          const diff = (now - selectedTime) / 1000;
          if (diff >= 900) {
            setLocked(true);
            setTimeLeft(0);
            setOrderComplete(true);
          } else {
            setTimeLeft(900 - diff);
            setOrderComplete(true);
          }
        }

        // Last orders
        setLastOrders(data.lastOrders || []);
      }
    };
    fetchUser();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!timeLeft || locked) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, locked]);

  const handlePlaceOrder = async (food) => {
    if (locked || loadingFood) return;
    setLoadingFood(food.name);

    try {
      const email = auth.currentUser?.email;
      if (!email) return;

      const now = new Date();

      // Update user document
      await setDoc(
        doc(db, 'users', email),
        {
          selectedFood: food.name,
          selectionTime: now.toISOString(),
          lastOrders: [{ name: food.name, time: now.toISOString() }, ...lastOrders].slice(0, 5),
        },
        { merge: true }
      );

      // Update UI
      setSelectedFood(food.name);
      setOrderComplete(true);
      setLocked(false);
      setTimeLeft(900);
      setLastOrders([{ name: food.name, time: now.toISOString() }, ...lastOrders].slice(0, 5));

      setSuccessMessage(`✅ Your order for "${food.name}" has been placed successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoadingFood(null);
    }
  };

  const handleResetOrder = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;

    await setDoc(
      doc(db, 'users', email),
      { selectedFood: '', selectionTime: new Date().toISOString() },
      { merge: true }
    );

    setSelectedCore('');
    setSelectedFood('');
    setOrderComplete(false);
    setLocked(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="dashboard-wrapper">
      <Header userName={userName} />

      <main className="dashboard-main">
        {/* Success message */}
        {successMessage && <div className="success-msg animated">{successMessage}</div>}

        {/* Greeting */}
        <section className="greeting-section">
          <h2>Welcome back, {userName}!</h2>
          {selectedFood && orderComplete && (
            <p>Your current order: <strong>{selectedFood}</strong></p>
          )}
        </section>

        {/* Food selection */}
        {!selectedCore ? (
          <section className="food-grid centered">
            {coreFoods.map(food => (
              <div key={food.name} className="food-card animated">
                <img src={food.image} alt={food.name} />
                <h3>{food.name}</h3>
                <button onClick={() => setSelectedCore(food.name)}>View Options</button>
              </div>
            ))}
          </section>
        ) : (
          <section className="food-grid centered">
            {subOptions[selectedCore].map(food => (
              <div key={food.name} className="food-card animated">
                <img src={food.image} alt={food.name} />
                <h3>{food.name}</h3>
                <button onClick={() => handlePlaceOrder(food)} disabled={loadingFood === food.name}>
                  {loadingFood === food.name ? '⏳ Placing...' : '🍽️ Place Order'}
                </button>
              </div>
            ))}
            <button className="back-btn" onClick={() => setSelectedCore('')}>Back</button>
          </section>
        )}

        {/* Order confirmation */}
        {orderComplete && (
          <section className="order-confirmation">
            <h3>✅ Current Order: {selectedFood}</h3>
            {!locked && timeLeft > 0 && <p>Time left to change: {formatTime(timeLeft)}</p>}
            {locked ? (
              <div>
                <p className="locked-text">🔒 Your order is locked</p>
                <button className="reorder-btn" onClick={handleResetOrder}>🔁 Reorder / Retake Order</button>
              </div>
            ) : (
              <button className="reset-btn" onClick={handleResetOrder}>Cancel Order</button>
            )}
          </section>
        )}

        {/* Last orders */}
        {lastOrders.length > 0 && (
          <section className="last-orders">
            <h3>📜 Last Orders</h3>
            <ul>
              {lastOrders.map((order, index) => (
                <li key={index}>
                  {order.name} — {new Date(order.time).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
