import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import './AdminDashboard.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Remove MUI icons and use custom SVG icons instead
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import DeleteIcon from '@mui/icons-material/Delete';

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Custom SVG Icons as Components
  const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );

  const DeleteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  );

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Real-time orders
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const today = new Date().toISOString().split('T')[0];
      const allOrders = snapshot.docs.flatMap(docSnap => {
        const data = docSnap.data();
        const lastOrders = data.lastOrders || [];
        return lastOrders
          .filter(order => order.time?.split('T')[0] === today)
          .map(order => ({
            id: docSnap.id + order.time, // Unique ID
            email: docSnap.id,
            name: data.name || docSnap.id.split('@')[0],
            food: order.name,
            time: order.time,
            confirmed: order.confirmed || false,
          }));
      });
      setOrders(allOrders);
    });

    if (auth.currentUser?.email) {
      const name = auth.currentUser.email.split('@')[0];
      setAdminName(name.charAt(0).toUpperCase() + name.slice(1));
    }

    return () => unsubscribe();
  }, []);

  const handleConfirm = async (email, orderTime) => {
    try {
      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      const updatedOrders = (data.lastOrders || []).map(order =>
        order.time === orderTime ? { ...order, confirmed: true } : order
      );

      await updateDoc(userRef, {
        lastOrders: updatedOrders,
        notification: `✅ Your order "${updatedOrders.find(o => o.time === orderTime)?.name}" has been confirmed!`,
      });

      toast.success('Order confirmed! ✅');
    } catch (err) {
      console.error(err);
      toast.error('Failed to confirm order.');
    }
  };

  const handleDelete = async (email, orderTime) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const userRef = doc(db, 'users', email);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      const updatedOrders = (data.lastOrders || []).filter(order => order.time !== orderTime);

      await updateDoc(userRef, {
        lastOrders: updatedOrders,
        notification: `❌ Your order for today has been deleted by admin.`,
      });

      toast.success('Order deleted! ❌');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete order.');
    }
  };

  // Stats
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.confirmed).length;
  const pendingOrders = totalOrders - confirmedOrders;

  return (
    <div className="admin-dashboard">
      <ToastContainer 
        position={isMobile ? "top-center" : "top-right"} 
        autoClose={3000}
        theme="colored"
        limit={1}
        hideProgressBar
      />

      <header className="dashboard-header">
        <div className="header-left">
          <h1>🍽️ Admin Dashboard</h1>
        </div>
        <div className="profile-section">
          <span className="admin-name">👤 {adminName}</span>
          <button className="logout-btn" onClick={() => {
            auth.signOut();
            window.location.reload();
          }}>
            Logout
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="card total">
          <h2>{totalOrders}</h2>
          <p>Total Orders</p>
        </div>
        <div className="card confirmed">
          <h2>{confirmedOrders}</h2>
          <p>Confirmed</p>
        </div>
        <div className="card pending">
          <h2>{pendingOrders}</h2>
          <p>Pending</p>
        </div>
      </div>

      {/* Orders Section */}
      <div className="orders-section">
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>No orders placed today.</p>
          </div>
        ) : (
          <>
            {isMobile ? (
              // MOBILE: Cards Layout
              <div className="orders-cards">
                {orders.map((order) => (
                  <div key={order.id} className={`order-card ${order.confirmed ? 'confirmed' : ''}`}>
                    <div className="card-header">
                      <span className="order-number">#{orders.indexOf(order) + 1}</span>
                      <span className={`status ${order.confirmed ? 'confirmed' : 'pending'}`}>
                        {order.confirmed ? '✅ Confirmed' : '⏳ Pending'}
                      </span>
                    </div>
                    
                    <div className="card-body">
                      <div className="order-info">
                        <div className="info-row">
                          <strong>Name:</strong> 
                          <span>{order.name}</span>
                        </div>
                        <div className="info-row">
                          <strong>🍽️ Food:</strong> 
                          <span>{order.food}</span>
                        </div>
                        <div className="info-row">
                          <strong>🕒 Time:</strong> 
                          <span>{new Date(order.time).toLocaleString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}</span>
                        </div>
                      </div>
                    </div>

                    {/* MOBILE ACTION BUTTONS - ALWAYS VISIBLE */}
                    <div className="card-actions">
                      <button 
                        onClick={() => handleConfirm(order.email, order.time)} 
                        className={`action-btn confirm-btn ${order.confirmed ? 'disabled' : ''}`}
                        disabled={order.confirmed}
                        title="Confirm Order"
                      >
                        <CheckCircleIcon />
                        <span className="btn-text">Confirm</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(order.email, order.time)} 
                        className="action-btn delete-btn"
                        title="Delete Order"
                      >
                        <DeleteIcon />
                        <span className="btn-text">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // DESKTOP: Table Layout
              <div className="table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Food</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className={order.confirmed ? 'confirmed' : ''}>
                        <td>{orders.indexOf(order) + 1}</td>
                        <td>{order.name}</td>
                        <td>{order.food}</td>
                        <td>{new Date(order.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td>
                          <span className={`status ${order.confirmed ? 'confirmed' : 'pending'}`}>
                            {order.confirmed ? '✅ Confirmed' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="action-buttons">
                          {/* DESKTOP ACTION BUTTONS - ALWAYS VISIBLE */}
                          <button 
                            onClick={() => handleConfirm(order.email, order.time)} 
                            className={`action-btn confirm-btn ${order.confirmed ? 'disabled' : ''}`}
                            disabled={order.confirmed}
                            title="Confirm Order"
                          >
                            <CheckCircleIcon />
                          </button>
                          <button 
                            onClick={() => handleDelete(order.email, order.time)} 
                            className="action-btn delete-btn"
                            title="Delete Order"
                          >
                            <DeleteIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;