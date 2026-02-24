"""
Discussion blueprint — REST API for the community forum.

Endpoints:
  GET    /api/discussions/posts              list posts (filter/sort/paginate)
  POST   /api/discussions/posts              create post
  GET    /api/discussions/posts/<id>         get post + comments
  PUT    /api/discussions/posts/<id>         edit post (author only)
  DELETE /api/discussions/posts/<id>         delete post (author or admin)
  POST   /api/discussions/posts/<id>/vote    vote up/down on a post
  POST   /api/discussions/posts/<id>/comments   add top-level comment
  PUT    /api/discussions/comments/<id>      edit comment (author)
  DELETE /api/discussions/comments/<id>      delete comment (author or admin)
  POST   /api/discussions/comments/<id>/vote vote on comment
  POST   /api/discussions/comments/<id>/reply add reply to comment
  POST   /api/discussions/comments/<id>/accept mark as best answer (post author)
  GET    /api/discussions/categories         list available categories
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.discussion import DiscussionPost, DiscussionComment, DiscussionVote
from app.models.user import User
from sqlalchemy import desc, asc

discussion_bp = Blueprint('discussion', __name__)

CATEGORIES = [
    'General', 'Contract Law', 'Employment Law', 'Corporate Law',
    'Family Law', 'Property Law', 'Criminal Law', 'Tax Law',
    'Intellectual Property', 'Startup & Business', 'Consumer Rights', 'Other'
]


# ─── helpers ──────────────────────────────────────────────────────────────────

def _get_user(identity):
    return User.query.get(int(identity))


def _vote_on(user_id, target_type, target_id, vote_dir):
    """Apply or toggle a vote. Returns dict with new counts."""
    existing = DiscussionVote.query.filter_by(
        user_id=user_id, target_type=target_type, target_id=target_id
    ).first()

    if target_type == 'post':
        obj = DiscussionPost.query.get(target_id)
    else:
        obj = DiscussionComment.query.get(target_id)
    if not obj:
        return None

    if existing:
        if existing.vote == vote_dir:
            # Toggle off
            if vote_dir == 'up':   obj.upvotes   = max(0, obj.upvotes - 1)
            else:                  obj.downvotes = max(0, obj.downvotes - 1)
            db.session.delete(existing)
        else:
            # Switch direction
            if vote_dir == 'up':
                obj.upvotes   = obj.upvotes + 1
                obj.downvotes = max(0, obj.downvotes - 1)
            else:
                obj.downvotes = obj.downvotes + 1
                obj.upvotes   = max(0, obj.upvotes - 1)
            existing.vote = vote_dir
    else:
        if vote_dir == 'up':   obj.upvotes   += 1
        else:                  obj.downvotes += 1
        db.session.add(DiscussionVote(
            user_id=user_id, target_type=target_type,
            target_id=target_id, vote=vote_dir
        ))

    db.session.commit()
    return {'upvotes': obj.upvotes, 'downvotes': obj.downvotes}


# ─── categories ───────────────────────────────────────────────────────────────

@discussion_bp.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({'categories': CATEGORIES}), 200


# ─── posts list ───────────────────────────────────────────────────────────────

@discussion_bp.route('/posts', methods=['GET'])
@jwt_required()
def list_posts():
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 50)
    category = request.args.get('category', '')
    search   = request.args.get('search', '').strip()
    sort_by  = request.args.get('sort', 'latest')   # latest | top | unanswered

    q = DiscussionPost.query

    if category and category != 'All':
        q = q.filter_by(category=category)
    if search:
        q = q.filter(
            db.or_(
                DiscussionPost.title.ilike(f'%{search}%'),
                DiscussionPost.content.ilike(f'%{search}%'),
                DiscussionPost.tags.ilike(f'%{search}%')
            )
        )
    if sort_by == 'top':
        q = q.order_by(desc(DiscussionPost.upvotes - DiscussionPost.downvotes),
                        desc(DiscussionPost.created_at))
    elif sort_by == 'unanswered':
        q = q.filter_by(is_answered=False).order_by(desc(DiscussionPost.created_at))
    else:
        q = q.order_by(desc(DiscussionPost.is_pinned), desc(DiscussionPost.created_at))

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)

    # Get comment counts efficiently
    from sqlalchemy import func
    comment_counts = {
        row.post_id: row.cnt
        for row in db.session.query(
            DiscussionComment.post_id,
            func.count(DiscussionComment.id).label('cnt')
        ).filter(DiscussionComment.post_id.in_([p.id for p in pagination.items]))
         .group_by(DiscussionComment.post_id).all()
    }

    return jsonify({
        'posts': [p.to_dict(comment_count=comment_counts.get(p.id, 0))
                  for p in pagination.items],
        'total':   pagination.total,
        'pages':   pagination.pages,
        'page':    page,
        'per_page': per_page,
    }), 200


# ─── create post ──────────────────────────────────────────────────────────────

@discussion_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    user = _get_user(get_jwt_identity())
    data = request.get_json() or {}

    title    = (data.get('title') or '').strip()
    content  = (data.get('content') or '').strip()
    category = (data.get('category') or 'General').strip()
    tags     = (data.get('tags') or '').strip()

    if not title or len(title) < 5:
        return jsonify({'error': 'Title must be at least 5 characters'}), 400
    if not content or len(content) < 10:
        return jsonify({'error': 'Content must be at least 10 characters'}), 400
    if category not in CATEGORIES:
        category = 'General'

    post = DiscussionPost(
        title=title, content=content,
        category=category, tags=tags,
        author_id=user.id
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({'post': post.to_dict()}), 201


# ─── get single post ──────────────────────────────────────────────────────────

@discussion_bp.route('/posts/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    post = DiscussionPost.query.get_or_404(post_id)
    post.view_count += 1
    db.session.commit()

    # Top-level comments with their replies
    top_comments = DiscussionComment.query.filter_by(
        post_id=post_id, parent_id=None
    ).order_by(desc(DiscussionComment.upvotes), asc(DiscussionComment.created_at)).all()

    return jsonify({
        'post': post.to_dict(),
        'comments': [c.to_dict(include_replies=True) for c in top_comments],
    }), 200


# ─── edit post ────────────────────────────────────────────────────────────────

@discussion_bp.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def edit_post(post_id):
    user = _get_user(get_jwt_identity())
    post = DiscussionPost.query.get_or_404(post_id)
    if post.author_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json() or {}
    if 'title'    in data: post.title    = data['title'].strip()
    if 'content'  in data: post.content  = data['content'].strip()
    if 'category' in data: post.category = data['category']
    if 'tags'     in data: post.tags     = data['tags']
    db.session.commit()
    return jsonify({'post': post.to_dict()}), 200


# ─── delete post ──────────────────────────────────────────────────────────────

@discussion_bp.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user = _get_user(get_jwt_identity())
    post = DiscussionPost.query.get_or_404(post_id)
    if post.author_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted'}), 200


# ─── vote on post ─────────────────────────────────────────────────────────────

@discussion_bp.route('/posts/<int:post_id>/vote', methods=['POST'])
@jwt_required()
def vote_post(post_id):
    user = _get_user(get_jwt_identity())
    data = request.get_json() or {}
    vote_dir = data.get('vote', 'up')
    if vote_dir not in ('up', 'down'):
        return jsonify({'error': 'Invalid vote direction'}), 400

    result = _vote_on(user.id, 'post', post_id, vote_dir)
    if result is None:
        return jsonify({'error': 'Post not found'}), 404
    return jsonify(result), 200


# ─── add comment ─────────────────────────────────────────────────────────────

@discussion_bp.route('/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user = _get_user(get_jwt_identity())
    post = DiscussionPost.query.get_or_404(post_id)
    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'Content required'}), 400

    comment = DiscussionComment(
        post_id=post_id, author_id=user.id, content=content
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify({'comment': comment.to_dict(include_replies=True)}), 201


# ─── reply to comment ────────────────────────────────────────────────────────

@discussion_bp.route('/comments/<int:comment_id>/reply', methods=['POST'])
@jwt_required()
def reply_comment(comment_id):
    user = _get_user(get_jwt_identity())
    parent = DiscussionComment.query.get_or_404(comment_id)
    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'Content required'}), 400

    reply = DiscussionComment(
        post_id=parent.post_id, parent_id=comment_id,
        author_id=user.id, content=content
    )
    db.session.add(reply)
    db.session.commit()
    return jsonify({'comment': reply.to_dict()}), 201


# ─── edit comment ────────────────────────────────────────────────────────────

@discussion_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def edit_comment(comment_id):
    user = _get_user(get_jwt_identity())
    comment = DiscussionComment.query.get_or_404(comment_id)
    if comment.author_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json() or {}
    comment.content = data.get('content', comment.content).strip()
    db.session.commit()
    return jsonify({'comment': comment.to_dict()}), 200


# ─── delete comment ──────────────────────────────────────────────────────────

@discussion_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    user = _get_user(get_jwt_identity())
    comment = DiscussionComment.query.get_or_404(comment_id)
    if comment.author_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted'}), 200


# ─── vote on comment ─────────────────────────────────────────────────────────

@discussion_bp.route('/comments/<int:comment_id>/vote', methods=['POST'])
@jwt_required()
def vote_comment(comment_id):
    user = _get_user(get_jwt_identity())
    data = request.get_json() or {}
    vote_dir = data.get('vote', 'up')
    if vote_dir not in ('up', 'down'):
        return jsonify({'error': 'Invalid vote direction'}), 400
    result = _vote_on(user.id, 'comment', comment_id, vote_dir)
    if result is None:
        return jsonify({'error': 'Comment not found'}), 404
    return jsonify(result), 200


# ─── accept best answer ──────────────────────────────────────────────────────

@discussion_bp.route('/comments/<int:comment_id>/accept', methods=['POST'])
@jwt_required()
def accept_comment(comment_id):
    user = _get_user(get_jwt_identity())
    comment = DiscussionComment.query.get_or_404(comment_id)
    post = DiscussionPost.query.get(comment.post_id)
    if not post or post.author_id != user.id:
        return jsonify({'error': 'Only the post author can accept an answer'}), 403

    # Unaccept all others on this post
    DiscussionComment.query.filter_by(post_id=post.id, is_accepted=True)\
                           .update({'is_accepted': False})
    comment.is_accepted = True
    post.is_answered = True
    db.session.commit()
    return jsonify({'message': 'Answer accepted'}), 200
