const User = require('../models/User');

// PATCH /api/users/:userId/profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, bio, bike, location } = req.body;

    if (!username || !bike) {
      return res.status(400).json({ message: 'Username and bike are required.' });
    }

    // Optional: prevent duplicate usernames
    const existingUser = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, bio, bike, location },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio || '',
        bike: updatedUser.bike || '',
        location: updatedUser.location || '',
        profilePicUrl: updatedUser.profilePicUrl || '',
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        username: user.username,
        bio: user.bio,
        bike: user.bike,
        location: user.location,
      }
    });
  } catch (err) {
    console.error('🚨 Error in getUserProfile:', err); // <- make sure this logs
    res.status(500).json({ message: 'Server error' });
  }
};
