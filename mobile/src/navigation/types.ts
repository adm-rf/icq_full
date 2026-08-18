/**
 * Navigation Types
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Contacts: undefined;
  Settings: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { conversationId: number; title?: string };
};

export type RootStackParamList = {
  Auth: AuthStackParamList;
  Main: MainTabParamList;
  Chat: ChatStackParamList;
};

export declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
