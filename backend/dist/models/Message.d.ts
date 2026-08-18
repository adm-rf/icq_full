import { Model } from 'sequelize';
declare class Message extends Model {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    content: string;
    type: string;
    status: string;
    readAt: Date | null;
    readonly createdAt: Date;
}
export default Message;
//# sourceMappingURL=Message.d.ts.map