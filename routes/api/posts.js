const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
// @API end point  POST /api/posts
// @desc Create Posts
// @access private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      const post = new Post(newPost);
      await post.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @API end point  GET /api/posts
// @desc Get posts
// @access private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }
});

// @API end point  GET /api/posts/:id
// @desc Get post by id
// @access private

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post Not Found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    console.log(err.name);
    if (err.name === 'CastError') {
      return res.status(404).json({ msg: 'Post Not Found' });
    }
    res.status(500).send('Server Error!');
  }
});

// @API end point  DELETE /api/posts/:id
// @desc Delete a post
// @access private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post Not Found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User is not authorized' });
    }
    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'CastError') {
      return res.status(404).json({ msg: 'Post Not Found' });
    }
    res.status(500).send('Server Error!');
  }
});

// @API end point  PUT /api/posts/like/:id
// @desc Like a post
// @access private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //Check if the post has already been liked

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }
});

// @API end point  PUT /api/posts/unlike/:id
// @desc UnLike a post
// @access private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //Check if the post has not been liked yet

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not been liked yet' });
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }
});

// @API end point  PUT /api/posts/comment/:id
// @desc Add Comment on a post
// @access private
router.put(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @API end point  Delete /api/posts/comment/:id/:comment_id
// @desc Delete Comment
// @access private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  //Pull comment
  const comment = post.comments.find(
    (comment) => comment.id === req.params.comment_id
  );
  //Check if comment exists or not
  if (!comment) {
    return res.status(404).json({ msg: 'Comment does not exists' });
  }
  // check for user
  if (comment.user.toString() !== req.user.id) {
    return res.status(401).json({ msg: 'User is not authorized' });
  }

  const removeIndex = post.comments
    .map((comment) => comment.user.toString())
    .indexOf(req.user.id);
  post.comments.splice(removeIndex, 1);
  await post.save();

  res.json(post.comments);
});
module.exports = router;
