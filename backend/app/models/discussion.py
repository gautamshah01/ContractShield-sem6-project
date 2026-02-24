"""
Discussion models for the Reddit/Quora-style community forum.
Tables: discussion_posts, discussion_comments, discussion_votes
"""

from datetime import datetime
from app import db


class DiscussionPost(db.Model):
    """A top-level discussion thread."""
    __tablename__ = 'discussion_posts'

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(300), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    category    = db.Column(db.String(100), nullable=False, default='General', index=True)
    tags        = db.Column(db.String(500), nullable=True)   # comma-separated
    author_id   = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    upvotes     = db.Column(db.Integer, default=0)
    downvotes   = db.Column(db.Integer, default=0)
    view_count  = db.Column(db.Integer, default=0)
    is_pinned   = db.Column(db.Boolean, default=False)
    is_answered = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author   = db.relationship('User', backref=db.backref('discussion_posts', lazy='dynamic'))
    comments = db.relationship('DiscussionComment', backref='post',
                               lazy='dynamic', cascade='all, delete-orphan',
                               primaryjoin='DiscussionPost.id == DiscussionComment.post_id')

    def to_dict(self, include_author=True, comment_count=None):
        d = {
            'id':          self.id,
            'title':       self.title,
            'content':     self.content,
            'category':    self.category,
            'tags':        [t.strip() for t in self.tags.split(',')] if self.tags else [],
            'upvotes':     self.upvotes,
            'downvotes':   self.downvotes,
            'view_count':  self.view_count,
            'is_pinned':   self.is_pinned,
            'is_answered': self.is_answered,
            'created_at':  self.created_at.isoformat(),
            'updated_at':  self.updated_at.isoformat(),
            'comment_count': comment_count if comment_count is not None
                             else self.comments.count(),
        }
        if include_author and self.author:
            d['author'] = {
                'id':        self.author.id,
                'full_name': self.author.full_name,
                'role':      self.author.role,
            }
        return d


class DiscussionComment(db.Model):
    """A comment (or nested reply) on a discussion post."""
    __tablename__ = 'discussion_comments'

    id        = db.Column(db.Integer, primary_key=True)
    post_id   = db.Column(db.Integer, db.ForeignKey('discussion_posts.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('discussion_comments.id', ondelete='CASCADE'), nullable=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content   = db.Column(db.Text, nullable=False)
    upvotes   = db.Column(db.Integer, default=0)
    downvotes = db.Column(db.Integer, default=0)
    is_accepted = db.Column(db.Boolean, default=False)   # marked as best answer
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author  = db.relationship('User', backref=db.backref('discussion_comments', lazy='dynamic'))
    replies = db.relationship('DiscussionComment', backref=db.backref('parent', remote_side=[id]),
                              lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_replies=False):
        d = {
            'id':          self.id,
            'post_id':     self.post_id,
            'parent_id':   self.parent_id,
            'content':     self.content,
            'upvotes':     self.upvotes,
            'downvotes':   self.downvotes,
            'is_accepted': self.is_accepted,
            'created_at':  self.created_at.isoformat(),
        }
        if self.author:
            d['author'] = {
                'id':        self.author.id,
                'full_name': self.author.full_name,
                'role':      self.author.role,
            }
        if include_replies:
            d['replies'] = [r.to_dict() for r in
                            self.replies.filter_by(parent_id=self.id)
                                        .order_by(DiscussionComment.created_at).all()]
        return d


class DiscussionVote(db.Model):
    """Track which user voted on which post/comment (prevent duplicate votes)."""
    __tablename__ = 'discussion_votes'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    target_type  = db.Column(db.String(20), nullable=False)   # 'post' | 'comment'
    target_id    = db.Column(db.Integer, nullable=False)
    vote         = db.Column(db.String(10), nullable=False)   # 'up' | 'down'
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'target_type', 'target_id', name='uq_discussion_vote'),
    )
