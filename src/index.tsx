import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

type Variables = {
  userId?: number;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== USER ENDPOINTS ====================

// Get user profile
app.get('/api/users/:username', async (c) => {
  const username = c.req.param('username')
  const { DB } = c.env
  
  const user = await DB.prepare(`
    SELECT id, username, display_name, bio, avatar_url, created_at
    FROM users
    WHERE username = ?
  `).bind(username).first()
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  // Get user stats
  const stats = await DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM posts WHERE user_id = ?) as post_count,
      (SELECT COUNT(*) FROM likes WHERE user_id = ?) as like_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = ?) as comment_count
  `).bind(user.id, user.id, user.id).first()
  
  return c.json({ ...user, stats })
})

// Create user profile
app.post('/api/users', async (c) => {
  const { username, display_name, bio, avatar_url } = await c.req.json()
  const { DB } = c.env
  
  try {
    const result = await DB.prepare(`
      INSERT INTO users (username, display_name, bio, avatar_url)
      VALUES (?, ?, ?, ?)
    `).bind(username, display_name, bio, avatar_url).run()
    
    return c.json({ 
      id: result.meta.last_row_id,
      username, 
      display_name, 
      bio, 
      avatar_url 
    })
  } catch (error) {
    return c.json({ error: 'Username already exists' }, 400)
  }
})

// ==================== POST ENDPOINTS ====================

// Get posts feed (with pagination)
app.get('/api/posts', async (c) => {
  const { DB } = c.env
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit
  
  const posts = await DB.prepare(`
    SELECT 
      p.*,
      u.username,
      u.display_name,
      u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM reposts WHERE post_id = p.id) as repost_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all()
  
  // Get media and catches for each post
  for (const post of posts.results) {
    const media = await DB.prepare(`
      SELECT * FROM media WHERE post_id = ? ORDER BY order_index
    `).bind(post.id).all()
    
    const catches = await DB.prepare(`
      SELECT fc.*, fs.name_ja as species_name_ja
      FROM fish_catches fc
      LEFT JOIN fish_species fs ON fc.species_id = fs.id
      WHERE fc.post_id = ?
    `).bind(post.id).all()
    
    post.media = media.results
    post.catches = catches.results
  }
  
  return c.json({ posts: posts.results, page, limit })
})

// Create new post
app.post('/api/posts', async (c) => {
  const data = await c.req.json()
  const { DB } = c.env
  
  // Start transaction
  const postResult = await DB.prepare(`
    INSERT INTO posts (user_id, content, location_name, latitude, longitude, caught_at, weather, tide)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.user_id,
    data.content,
    data.location_name,
    data.latitude,
    data.longitude,
    data.caught_at,
    data.weather,
    data.tide
  ).run()
  
  const postId = postResult.meta.last_row_id
  
  // Insert catches
  if (data.catches && data.catches.length > 0) {
    for (const catchData of data.catches) {
      await DB.prepare(`
        INSERT INTO fish_catches (post_id, species_id, species_name, size_cm, weight_kg, tackle, bait)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        postId,
        catchData.species_id,
        catchData.species_name,
        catchData.size_cm,
        catchData.weight_kg,
        catchData.tackle,
        catchData.bait
      ).run()
    }
  }
  
  // Insert media
  if (data.media && data.media.length > 0) {
    for (let i = 0; i < data.media.length; i++) {
      const mediaItem = data.media[i]
      await DB.prepare(`
        INSERT INTO media (post_id, media_type, url, thumbnail_url, order_index)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        postId,
        mediaItem.media_type,
        mediaItem.url,
        mediaItem.thumbnail_url,
        i
      ).run()
    }
  }
  
  return c.json({ id: postId, message: 'Post created successfully' })
})

// Delete post
app.delete('/api/posts/:id', async (c) => {
  const postId = c.req.param('id')
  const { DB } = c.env
  
  await DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run()
  
  return c.json({ message: 'Post deleted successfully' })
})

// ==================== INTERACTION ENDPOINTS ====================

// Like a post
app.post('/api/posts/:id/like', async (c) => {
  const postId = c.req.param('id')
  const { user_id } = await c.req.json()
  const { DB } = c.env
  
  try {
    await DB.prepare(`
      INSERT INTO likes (post_id, user_id) VALUES (?, ?)
    `).bind(postId, user_id).run()
    
    return c.json({ message: 'Post liked successfully' })
  } catch (error) {
    return c.json({ error: 'Already liked' }, 400)
  }
})

// Unlike a post
app.delete('/api/posts/:id/like', async (c) => {
  const postId = c.req.param('id')
  const { user_id } = await c.req.json()
  const { DB } = c.env
  
  await DB.prepare(`
    DELETE FROM likes WHERE post_id = ? AND user_id = ?
  `).bind(postId, user_id).run()
  
  return c.json({ message: 'Post unliked successfully' })
})

// Add comment
app.post('/api/posts/:id/comments', async (c) => {
  const postId = c.req.param('id')
  const { user_id, content, parent_comment_id } = await c.req.json()
  const { DB } = c.env
  
  const result = await DB.prepare(`
    INSERT INTO comments (post_id, user_id, parent_comment_id, content)
    VALUES (?, ?, ?, ?)
  `).bind(postId, user_id, parent_comment_id, content).run()
  
  return c.json({ id: result.meta.last_row_id, message: 'Comment added successfully' })
})

// Get comments for a post
app.get('/api/posts/:id/comments', async (c) => {
  const postId = c.req.param('id')
  const { DB } = c.env
  
  const comments = await DB.prepare(`
    SELECT 
      c.*,
      u.username,
      u.display_name,
      u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).bind(postId).all()
  
  return c.json({ comments: comments.results })
})

// ==================== RANKING ENDPOINTS ====================

// Get rankings
app.get('/api/rankings', async (c) => {
  const { DB } = c.env
  const species_id = c.req.query('species_id')
  const category = c.req.query('category') || 'size'
  const period = c.req.query('period') || 'all_time'
  
  let query = `
    SELECT 
      r.*,
      u.username,
      u.display_name,
      u.avatar_url,
      fs.name_ja as species_name
    FROM rankings r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN fish_species fs ON r.species_id = fs.id
    WHERE r.category = ? AND r.period = ?
  `
  
  const params = [category, period]
  
  if (species_id) {
    query += ' AND r.species_id = ?'
    params.push(species_id)
  }
  
  query += ' ORDER BY r.rank ASC LIMIT 100'
  
  const rankings = await DB.prepare(query).bind(...params).all()
  
  return c.json({ rankings: rankings.results })
})

// ==================== SPECIES ENDPOINTS ====================

// Get all fish species
app.get('/api/species', async (c) => {
  const { DB } = c.env
  
  const species = await DB.prepare(`
    SELECT * FROM fish_species ORDER BY name_ja
  `).all()
  
  return c.json({ species: species.results })
})

// ==================== MAIN PAGE ====================

// Default route - serve the main application
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FishSNS - リアルタイム釣果共有SNS</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/locale/ja.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app