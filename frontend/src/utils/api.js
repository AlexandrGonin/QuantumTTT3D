export async function initAuth(initData) {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend.onrender.com';
    
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Authentication failed');
    }

    return data.user;

  } catch (error) {
    console.error('❌ Auth error:', error);
    throw new Error('Authentication failed: ' + error.message);
  }
}