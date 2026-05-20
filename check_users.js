const mongoose = require('mongoose');

async function checkUsers() {
  try {
    const MONGO_URI = 'mongodb://localhost:27017/air_components_manager';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('./src/models/User');
    const users = await User.find({});
    console.log('--- USERS LIST ---');
    users.forEach(u => {
      console.log(`ID: ${u._id} | studentId: ${u.studentId} | name: ${u.name} | role: ${u.role} | phone: ${u.phone}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
