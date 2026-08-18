import { Model } from 'sequelize';
declare class Conversation extends Model {
    id: number;
    type: string;
    name: string | null;
    participantIds: number[];
    createdBy: number | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Conversation;
//# sourceMappingURL=Conversation.d.ts.map