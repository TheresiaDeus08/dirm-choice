import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import Header from '../Header/Header';
import './Dashboard.css';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ugali from '../../assets/ugali.webp';
import rice from '../../assets/wali.webp';
import pilau from '../../assets/pilau.webp';
import chips from '../../assets/chips.webp';
import soda from '../../assets/soda.webp';
import ugaliMeat from '../../assets/ugali_meat.webp';
import ugaliFish from '../../assets/ugali_fish.webp';
import riceMeat from '../../assets/rice_meat.webp';
import riceChicken from '../../assets/rice_chicken.webp';
import pilauMeat from '../../assets/pilau_meat.webp';
import pilauChicken from '../../assets/pilau_chicken.webp';
import frenchFries from '../../assets/french_fries.webp';
import friesOmelette from '../../assets/fries_omelette.webp';
import cola from '../../assets/cola.jpeg';

const coreFoods = [
  { name: 'Ugali', image: ugali },
  { name: 'Rice', image: rice },
  { name: 'Pilau', image: pilau },
  { name: 'Chips', image: chips },
  { name: 'Soda', image: soda },
];

const subOptions = {
  Ugali: [{ name: 'Ugali with meat', image: ugaliMeat }, { name: 'Ugali with fish', image: ugaliFish }],
  Rice: [{ name: 'Rice with meat', image: riceMeat }, { name: 'Rice with chicken', image: riceChicken }],
  Pilau: [{ name: 'Pilau with meat', image: pilauMeat }, { name: 'Pilau with chicken', image: pilauChicken }],
  Chips: [{ name: 'French fries', image: frenchFries }, { name: 'Fries omelette', image: friesOmelette }],
  Soda: [{ name: 'Cola', image: cola }],
};

function Dashboard() {
  const [userName, setUserName] = useState('');
  const [selectedCore, setSelectedCore] = useState('');
  const [selectedFood, setSelectedFood] = useState('');
  const [locked, setLocked] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [loadingFood, setLoadingFood] = useState(null);
  const [lastOrders, setLastOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, confirmedOrders: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const email = auth.currentUser?.email;

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!email) return;
    const userRef = doc(db, 'users', email);

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const firstName = email.split('@')[0];
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));

        setSelectedFood(data.selectedFood || '');
        const core = coreFoods.find(c => data.selectedFood?.startsWith(c.name));
        if (core) setSelectedCore(core.name);

        setOrderComplete(!!data.selectedFood);
        setLocked(data.locked || false);

        const pending = (data.lastOrders || []).filter(order => !order.confirmed);
        const confirmed = (data.lastOrders || []).filter(order => order.confirmed);
        setLastOrders(pending);

        setStats({ 
          totalOrders: (data.lastOrders || []).length, 
          pendingOrders: pending.length,
          confirmedOrders: confirmed.length
        });
      }
    });

    return () => unsubscribe();
  }, [email]);

  const isAfterCutoff = () => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(11, 0, 0, 0);
    return now > cutoff;
  };

  const handlePlaceOrder = async (food) => {
    if (!email) return;
    if (isAfterCutoff() && selectedCore !== 'Soda') {
      toast.warn('Food orders are closed after 11:00 AM.', {
        position: isMobile ? "top-center" : "top-right"
      });
      return;
    }
    if (orderComplete && selectedCore !== 'Soda') {
      toast.warn('You have already placed your food order.', {
        position: isMobile ? "top-center" : "top-right"
      });
      return;
    }
    try {
      setLoadingFood(food.name);
      const now = new Date();
      const userRef = doc(db, 'users', email);
      const newOrder = { name: food.name, time: now.toISOString(), confirmed: false };

      await setDoc(userRef, {
        selectedFood: food.name,
        orderDate: now.toDateString(),
        locked: selectedCore !== 'Soda',
        lastOrders: [newOrder, ...lastOrders].slice(0, 10),
      }, { merge: true });

      setSelectedFood(food.name);
      setOrderComplete(true);
      setLocked(selectedCore !== 'Soda');
      toast.success(`Order "${food.name}" placed successfully!`, {
        position: isMobile ? "top-center" : "top-right"
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order.', {
        position: isMobile ? "top-center" : "top-right"
      });
    } finally {
      setLoadingFood(null);
    }
  };

  const handleResetOrder = async () => {
    if (!email) return;
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, { selectedFood: '', locked: false }, { merge: true });
    setSelectedCore('');
    setSelectedFood('');
    setOrderComplete(false);
    setLocked(false);
    toast.info('You can place a new order.', {
      position: isMobile ? "top-center" : "top-right"
    });
  };

  return (
    <div className="dashboard-wrapper">
      <ToastContainer 
        position={isMobile ? "top-center" : "top-right"} 
        autoClose={3000} 
        theme="colored"
        limit={1}
      />
      
      <Header userName={userName} />

      {/* STATS CARDS - MOBILE PERFECT SINGLE ROW */}
      <div className="stats-cards">
        <div className="card total">
          <h3>Total</h3>
          <p>{stats.totalOrders}</p>
        </div>
        <div className="card pending">
          <h3>Pending</h3>
          <p>{stats.pendingOrders}</p>
        </div>
        <div className="card confirmed">
          <h3>Confirmed</h3>
          <p>{stats.confirmedOrders}</p>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Food Selection */}
        <div className="food-selection">
          {!selectedCore ? (
            <div className="food-grid">
              {coreFoods.map(food => (
                <div key={food.name} className="food-card">
                  <img src={food.image} alt={food.name} />
                  <h3>{food.name}</h3>
                  <button onClick={() => setSelectedCore(food.name)}>
                    View Options
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="food-grid">
              {subOptions[selectedCore].map(food => (
                <div key={food.name} className="food-card">
                  <img src={food.image} alt={food.name} />
                  <h3>{food.name}</h3>
                  <button
                    onClick={() => handlePlaceOrder(food)}
                    disabled={loadingFood === food.name || (orderComplete && selectedCore !== 'Soda')}
                  >
                    {loadingFood === food.name ? (
                      <>
                        <AccessTimeIcon style={{ fontSize: '16px' }} />
                        Placing...
                      </>
                    ) : (
                      <>
                        <CheckCircleOutlineIcon style={{ fontSize: '16px' }} />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              ))}
              <button className="back-btn" onClick={() => setSelectedCore('')}>
                ← Back
              </button>
            </div>
          )}

          {/* Current Order */}
          {orderComplete && (
            <div className="current-order">
              <h3>Current Order: {selectedFood}</h3>
              {locked ? (
                <p className="locked-text">
                  <AccessTimeIcon style={{ fontSize: '18px' }} /> 
                  Food order locked
                </p>
              ) : (
                <button onClick={handleResetOrder}>Cancel Order</button>
              )}
            </div>
          )}
        </div>

        {/* Placed Orders Table */}
        <div className="last-orders-table-wrapper">
          <h3>Last Pending Orders</h3>
          {lastOrders.length === 0 ? (
            <div className="no-orders">
              <p>No pending orders</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Food</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lastOrders.map((order, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{order.name}</td>
                    <td>{new Date(order.time).toLocaleString()}</td>
                    <td>
                      {order.confirmed ? (
                        <CheckCircleOutlineIcon style={{ color: '#10b981' }} />
                      ) : (
                        <AccessTimeIcon style={{ color: '#f59e0b' }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;