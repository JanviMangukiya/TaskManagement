import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB Connection Error', err.message);
    });
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error.message);
  }
};

export default connectDB;