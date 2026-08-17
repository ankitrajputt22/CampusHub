import { useParams } from 'react-router-dom';

import { ChatWorkspace } from '../components/ChatWorkspace';

export function ConversationDetailsPage() {
  const { conversationId } = useParams();
  return <ChatWorkspace conversationId={Number(conversationId)} />;
}
