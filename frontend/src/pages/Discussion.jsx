import { useState, useEffect, useCallback, useRef } from 'react';
import { discussionApi } from '../api/discussion';
import { useAuth } from '../context/AuthContext';
import {
    MessageSquare, ThumbsUp, ThumbsDown, Plus, Search, Filter,
    ChevronDown, ChevronUp, CornerDownRight, Trash2, Edit2,
    Check, X, ArrowUp, ArrowDown, Eye, Tag, Clock, Bookmark,
    TrendingUp, AlertCircle, Scale, Loader2, Send, RefreshCw,
    CheckCircle2, Star
} from 'lucide-react';

const CATEGORIES = [
    'All', 'General', 'Contract Law', 'Employment Law', 'Corporate Law',
    'Family Law', 'Property Law', 'Criminal Law', 'Tax Law',
    'Intellectual Property', 'Startup & Business', 'Consumer Rights', 'Other'
];

const CATEGORY_COLORS = {
    'Contract Law': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Employment Law': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Corporate Law': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Family Law': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Property Law': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Criminal Law': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Tax Law': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Intellectual Property': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Startup & Business': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'Consumer Rights': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'General': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    'Other': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function timeAgo(iso) {
    const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
}

function RoleChip({ role }) {
    if (role === 'lawyer') return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
            Lawyer
        </span>
    );
    if (role === 'admin') return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
            Admin
        </span>
    );
    return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
            Client
        </span>
    );
}

// ── VoteButtons ───────────────────────────────────────────────────────────────
function VoteButtons({ upvotes, downvotes, onVote, compact = false }) {
    const score = upvotes - downvotes;
    return (
        <div className={`flex items-center gap-1 ${compact ? '' : 'flex-col'}`}>
            <button
                onClick={() => onVote('up')}
                className={`p-1 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition-all ${compact ? 'flex items-center gap-1' : ''}`}
            >
                <ArrowUp size={compact ? 14 : 18} />
            </button>
            <span className={`font-bold tabular-nums ${score >= 0 ? 'text-emerald-400' : 'text-red-400'} ${compact ? 'text-xs' : 'text-base'}`}>
                {score}
            </span>
            <button
                onClick={() => onVote('down')}
                className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
                <ArrowDown size={compact ? 14 : 18} />
            </button>
        </div>
    );
}

// ── CommentBox ────────────────────────────────────────────────────────────────
function CommentBox({ onSubmit, placeholder = 'Write a comment...', initialValue = '', onCancel, autoFocus = false }) {
    const [value, setValue] = useState(initialValue);
    const [submitting, setSubmitting] = useState(false);
    const ref = useRef(null);

    useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

    const handleSubmit = async () => {
        if (!value.trim()) return;
        setSubmitting(true);
        try { await onSubmit(value.trim()); setValue(''); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="group">
            <textarea
                ref={ref}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
            />
            <div className="flex justify-end gap-2 mt-2">
                {onCancel && (
                    <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !value.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                >
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {submitting ? 'Sending...' : 'Post'}
                </button>
            </div>
        </div>
    );
}

// ── SingleComment ─────────────────────────────────────────────────────────────
function SingleComment({ comment, postAuthorId, currentUserId, userRole, onVote, onReply, onDelete, onAccept, depth = 0 }) {
    const [showReply, setShowReply] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const replies = comment.replies || [];
    const isOwn = comment.author?.id === currentUserId;
    const isPostAuthor = postAuthorId === currentUserId;

    return (
        <div className={`${depth > 0 ? 'ml-6 pl-4 border-l border-white/5' : ''}`}>
            <div className={`rounded-xl p-4 mb-2 transition-all ${comment.is_accepted ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/5'} hover:border-white/10`}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {comment.author?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-semibold text-white">{comment.author?.full_name || 'Unknown'}</span>
                    <RoleChip role={comment.author?.role} />
                    {comment.is_accepted && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold ml-auto">
                            <CheckCircle2 size={10} /> Best Answer
                        </span>
                    )}
                    <span className="text-slate-500 text-xs ml-auto">{timeAgo(comment.created_at)}</span>
                </div>

                {/* Content */}
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                    <VoteButtons
                        upvotes={comment.upvotes} downvotes={comment.downvotes}
                        onVote={v => onVote(comment.id, v)} compact
                    />
                    <button onClick={() => setShowReply(s => !s)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors">
                        <CornerDownRight size={12} /> Reply
                    </button>
                    {replies.length > 0 && (
                        <button onClick={() => setShowReplies(s => !s)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                    {isPostAuthor && depth === 0 && !comment.is_accepted && (
                        <button onClick={() => onAccept(comment.id)}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors ml-auto">
                            <CheckCircle2 size={12} /> Accept
                        </button>
                    )}
                    {isOwn && (
                        <button onClick={() => onDelete(comment.id)}
                            className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors ml-auto">
                            <Trash2 size={12} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Reply box */}
            {showReply && (
                <div className="ml-6 mb-3">
                    <CommentBox
                        placeholder="Write a reply..."
                        onSubmit={async content => { await onReply(comment.id, content); setShowReply(false); }}
                        onCancel={() => setShowReply(false)}
                        autoFocus
                    />
                </div>
            )}

            {/* Nested replies */}
            {showReplies && replies.map(r => (
                <SingleComment
                    key={r.id} comment={r}
                    postAuthorId={postAuthorId} currentUserId={currentUserId}
                    userRole={userRole} onVote={onVote} onReply={onReply}
                    onDelete={onDelete} onAccept={onAccept} depth={depth + 1}
                />
            ))}
        </div>
    );
}

// ── PostCard (list view) ──────────────────────────────────────────────────────
function PostCard({ post, onClick }) {
    const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General'];
    return (
        <div
            onClick={onClick}
            className="group bg-[#0f1629]/80 border border-white/[0.06] rounded-2xl p-5 cursor-pointer hover:border-violet-500/30 hover:bg-[#111827]/90 transition-all duration-200"
        >
            <div className="flex gap-4">
                {/* Vote score sidebar */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0 w-10">
                    <span className={`text-lg font-bold tabular-nums ${(post.upvotes - post.downvotes) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {post.upvotes - post.downvotes}
                    </span>
                    <span className="text-slate-600 text-[10px]">score</span>
                    <div className="w-px h-3 bg-white/10 my-1" />
                    <MessageSquare size={14} className="text-slate-600" />
                    <span className="text-slate-600 text-[10px]">{post.comment_count}</span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {post.is_pinned && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                                Pinned
                            </span>
                        )}
                        {post.is_answered && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                                <CheckCircle2 size={9} /> Answered
                            </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${catColor}`}>
                            {post.category}
                        </span>
                    </div>

                    <h3 className="text-white font-semibold text-base group-hover:text-violet-300 transition-colors line-clamp-2 mb-1.5">
                        {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.content}</p>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.tags.slice(0, 4).map((t, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/8">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[9px] font-bold text-white">
                                {post.author?.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span>{post.author?.full_name}</span>
                            <RoleChip role={post.author?.role} />
                        </div>
                        <span className="text-slate-700">·</span>
                        <div className="flex items-center gap-1"><Clock size={11} /> {timeAgo(post.created_at)}</div>
                        <span className="text-slate-700">·</span>
                        <div className="flex items-center gap-1"><Eye size={11} /> {post.view_count}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Discussion Component ─────────────────────────────────────────────────
export default function Discussion({ user }) {
    const [view, setView] = useState('list');   // 'list' | 'post' | 'new'
    const [posts, setPosts] = useState([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [selectedPost, setSelectedPost] = useState(null);
    const [postComments, setPostComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // filters
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState('latest');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // new post form
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General', tags: '' });
    const [postError, setPostError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // user identity
    const myId = (() => {
        try { return parseInt(JSON.parse(atob(user?.token?.split('.')[1] || '')).sub); }
        catch { return null; }
    })();

    // ── Load posts ─────────────────────────────────────────────────────────────
    const loadPosts = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const { data } = await discussionApi.listPosts({
                page: pg, per_page: 15,
                category: activeCategory === 'All' ? '' : activeCategory,
                sort: sortBy, search,
            });
            setPosts(data.posts || []);
            setTotalPosts(data.total || 0);
            setTotalPages(data.pages || 1);
            setPage(pg);
        } catch (e) {
            console.error('Failed to load posts', e);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, sortBy, search]);

    useEffect(() => { if (view === 'list') loadPosts(1); }, [view, loadPosts]);

    // ── Open post ──────────────────────────────────────────────────────────────
    const openPost = async (post) => {
        setLoading(true);
        try {
            const { data } = await discussionApi.getPost(post.id);
            setSelectedPost(data.post);
            setPostComments(data.comments || []);
            setView('post');
        } catch { } finally { setLoading(false); }
    };

    // ── Create post ───────────────────────────────────────────────────────────
    const handleCreatePost = async () => {
        if (!newPost.title.trim() || newPost.title.length < 5)
            return setPostError('Title must be at least 5 characters.');
        if (!newPost.content.trim() || newPost.content.length < 10)
            return setPostError('Body must be at least 10 characters.');
        setPostError(''); setSubmitting(true);
        try {
            const { data } = await discussionApi.createPost(newPost);
            setNewPost({ title: '', content: '', category: 'General', tags: '' });
            setView('list');
            loadPosts(1);
        } catch (e) {
            setPostError(e.response?.data?.error || 'Failed to create post.');
        } finally { setSubmitting(false); }
    };

    // ── Vote post ─────────────────────────────────────────────────────────────
    const handleVotePost = async (dir) => {
        if (!selectedPost) return;
        try {
            const { data } = await discussionApi.votePost(selectedPost.id, dir);
            setSelectedPost(p => ({ ...p, ...data }));
        } catch { }
    };

    // ── Vote comment ──────────────────────────────────────────────────────────
    const handleVoteComment = async (commentId, dir) => {
        try {
            const { data } = await discussionApi.voteComment(commentId, dir);
            // Update in state recursively
            const updateComment = (list) => list.map(c => {
                if (c.id === commentId) return { ...c, ...data };
                if (c.replies?.length) return { ...c, replies: updateComment(c.replies) };
                return c;
            });
            setPostComments(updateComment);
        } catch { }
    };

    // ── Add comment ───────────────────────────────────────────────────────────
    const handleAddComment = async (content) => {
        try {
            const { data } = await discussionApi.addComment(selectedPost.id, content);
            setPostComments(c => [...c, { ...data.comment, replies: [] }]);
            setSelectedPost(p => ({ ...p, comment_count: (p.comment_count || 0) + 1 }));
        } catch { }
    };

    // ── Reply ─────────────────────────────────────────────────────────────────
    const handleReply = async (commentId, content) => {
        try {
            const { data } = await discussionApi.replyComment(commentId, content);
            const addReply = (list) => list.map(c => {
                if (c.id === commentId) return { ...c, replies: [...(c.replies || []), data.comment] };
                if (c.replies?.length) return { ...c, replies: addReply(c.replies) };
                return c;
            });
            setPostComments(addReply);
        } catch { }
    };

    // ── Delete comment ────────────────────────────────────────────────────────
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await discussionApi.deleteComment(commentId);
            const remove = (list) => list
                .filter(c => c.id !== commentId)
                .map(c => ({ ...c, replies: remove(c.replies || []) }));
            setPostComments(remove);
        } catch { }
    };

    // ── Accept answer ─────────────────────────────────────────────────────────
    const handleAccept = async (commentId) => {
        try {
            await discussionApi.acceptComment(commentId);
            setPostComments(list => list.map(c => ({
                ...c, is_accepted: c.id === commentId,
                replies: (c.replies || []).map(r => ({ ...r, is_accepted: r.id === commentId }))
            })));
            setSelectedPost(p => ({ ...p, is_answered: true }));
        } catch { }
    };

    // ── Delete post ───────────────────────────────────────────────────────────
    const handleDeletePost = async () => {
        if (!window.confirm('Delete this discussion?')) return;
        try {
            await discussionApi.deletePost(selectedPost.id);
            setView('list');
            loadPosts(1);
        } catch { }
    };

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen">
            {/* ── Header bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Scale size={22} className="text-violet-400" />
                        Legal Community
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {view === 'list' && `${totalPosts} discussions · Ask questions, share insights`}
                        {view === 'post' && (
                            <button onClick={() => setView('list')} className="hover:text-violet-400 transition-colors">
                                Back to discussions
                            </button>
                        )}
                        {view === 'new' && (
                            <button onClick={() => setView('list')} className="hover:text-violet-400 transition-colors">
                                Back to discussions
                            </button>
                        )}
                    </p>
                </div>
                {view !== 'new' && (
                    <button
                        onClick={() => setView('new')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/30"
                    >
                        <Plus size={16} /> New Discussion
                    </button>
                )}
            </div>

            {/* ════════════════ LIST VIEW ════════════════ */}
            {view === 'list' && (
                <div>
                    {/* Search + Sort bar */}
                    <div className="flex flex-wrap gap-3 mb-5">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); loadPosts(1); } }}
                                placeholder="Search discussions..."
                                className="w-full bg-[#0f1629] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['latest', 'top', 'unanswered'].map(s => (
                                <button key={s} onClick={() => { setSortBy(s); loadPosts(1); }}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${sortBy === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                                    {s === 'latest' ? 'Latest' : s === 'top' ? 'Top' : 'Unanswered'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 flex-wrap mb-5">
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => { setActiveCategory(cat); loadPosts(1); }}
                                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${activeCategory === cat ? 'bg-violet-600/30 text-violet-300 border-violet-500/50' : 'bg-white/[0.03] text-slate-400 border-white/8 hover:border-white/20 hover:text-white'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Posts */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-violet-500" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <MessageSquare size={48} className="text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500">No discussions yet. Be the first to post!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {posts.map(p => (
                                <PostCard key={p.id} post={p} onClick={() => openPost(p)} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => loadPosts(pg)}
                                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${pg === page ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                    {pg}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════ SINGLE POST VIEW ════════════════ */}
            {view === 'post' && selectedPost && (
                <div className="max-w-3xl">
                    {/* Post body */}
                    <div className="bg-[#0f1629]/80 border border-white/[0.06] rounded-2xl p-6 mb-4">
                        <div className="flex gap-4">
                            {/* Vote column */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <VoteButtons
                                    upvotes={selectedPost.upvotes} downvotes={selectedPost.downvotes}
                                    onVote={handleVotePost}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedPost.is_pinned && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">Pinned</span>
                                    )}
                                    {selectedPost.is_answered && (
                                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                                            <CheckCircle2 size={9} /> Answered
                                        </span>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${CATEGORY_COLORS[selectedPost.category] || CATEGORY_COLORS['General']}`}>
                                        {selectedPost.category}
                                    </span>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-3">{selectedPost.title}</h2>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{selectedPost.content}</p>

                                {/* Tags */}
                                {selectedPost.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {selectedPost.tags.map((t, i) => (
                                            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/8">#{t}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                            {selectedPost.author?.full_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <span className="text-white text-sm font-medium">{selectedPost.author?.full_name}</span>
                                        <RoleChip role={selectedPost.author?.role} />
                                    </div>
                                    <span>·</span>
                                    <span>{timeAgo(selectedPost.created_at)}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1"><Eye size={11} /> {selectedPost.view_count} views</span>
                                    {selectedPost.author?.id === myId && (
                                        <>
                                            <span>·</span>
                                            <button onClick={handleDeletePost} className="flex items-center gap-1 text-red-400/70 hover:text-red-400">
                                                <Trash2 size={11} /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comments section */}
                    <div className="mb-4">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare size={16} className="text-violet-400" />
                            {postComments.length} {postComments.length === 1 ? 'Answer' : 'Answers'}
                        </h3>

                        {postComments.length === 0 && (
                            <p className="text-slate-500 text-sm mb-4 text-center py-6">
                                No answers yet. Be the first to help!
                            </p>
                        )}

                        <div className="space-y-2 mb-6">
                            {postComments.map(c => (
                                <SingleComment
                                    key={c.id} comment={c}
                                    postAuthorId={selectedPost.author?.id}
                                    currentUserId={myId}
                                    userRole={user?.role}
                                    onVote={handleVoteComment}
                                    onReply={handleReply}
                                    onDelete={handleDeleteComment}
                                    onAccept={handleAccept}
                                />
                            ))}
                        </div>

                        {/* Add answer */}
                        <div className="bg-[#0f1629]/80 border border-white/[0.06] rounded-2xl p-5">
                            <h4 className="text-white font-semibold mb-3 text-sm">Your Answer</h4>
                            <CommentBox
                                placeholder="Share your legal knowledge or ask a follow-up question..."
                                onSubmit={handleAddComment}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ NEW POST VIEW ════════════════ */}
            {view === 'new' && (
                <div className="max-w-2xl">
                    <div className="bg-[#0f1629]/80 border border-white/[0.06] rounded-2xl p-6">
                        <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                            <Plus size={18} className="text-violet-400" /> New Discussion
                        </h3>

                        {postError && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                                <AlertCircle size={14} /> {postError}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Title *</label>
                                <input
                                    value={newPost.title}
                                    onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                                    placeholder="What's your legal question or topic?"
                                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                />
                                <p className="text-slate-600 text-[11px] mt-1">{newPost.title.length}/300 characters</p>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Category *</label>
                                <select
                                    value={newPost.category}
                                    onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-all appearance-none"
                                >
                                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Description *</label>
                                <textarea
                                    value={newPost.content}
                                    onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                                    placeholder="Explain your question or share your insight in detail..."
                                    rows={6}
                                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Tags <span className="normal-case text-slate-600 font-normal">(comma separated)</span></label>
                                <div className="relative">
                                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={newPost.tags}
                                        onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                                        placeholder="e.g. NDA, employment, startup"
                                        className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setView('list')}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-violet-900/30"
                                >
                                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Posting...</> : <><Send size={14} /> Post Discussion</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
