import { formatDistanceToNow } from 'date-fns';
import { Heart, Repeat2, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Notification } from '@/types/types';
import { Link } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'retweet':
        return <Repeat2 className="w-5 h-5 text-green-500" />;
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = () => {
    const actorName = notification.actorName || notification.actorUsername || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your tweet`;
      case 'retweet':
        return `${actorName} retweeted your tweet`;
      case 'reply':
        return `${actorName} replied to your tweet`;
      case 'follow':
        return `${actorName} started following you`;
      case 'mention':
        return `${actorName} mentioned you in a tweet`;
      default:
        return 'New notification';
    }
  };

  const getNotificationLink = () => {
    switch (notification.type) {
      case 'like':
      case 'retweet':
      case 'reply':
        return notification.targetId ? `/tweet/${notification.targetId}` : null;
      case 'follow':
        return notification.actorUsername ? `/profile/${notification.actorUsername}` : null;
      case 'mention':
        return notification.targetId ? `/tweet/${notification.targetId}` : null;
      default:
        return null;
    }
  };

  const link = getNotificationLink();
  const content = (
    <div
      className={`flex items-start space-x-3 p-4 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
    >
      {/* Notification Icon */}
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon()}
      </div>

      {/* Actor Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={notification.actorImage || undefined} />
          <AvatarFallback>
            {(notification.actorName || notification.actorUsername || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-foreground">
              {getNotificationText()}
            </p>
            
            {/* Tweet content preview for tweet-related notifications */}
            {(notification.type === 'like' || notification.type === 'retweet' || notification.type === 'reply') && 
             notification.metadata?.tweetContent && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                "{notification.metadata.tweetContent}"
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="block">
      {content}
    </Link>
  ) : (
    content
  );
} 