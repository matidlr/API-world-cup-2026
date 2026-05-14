import { FinalChatApiResponse, FinalChatTeamsPreviewApiResponse } from './final-chat-api.interface';

export interface FinalChatViewModel {
  lang: 'es' | 'en';
  loading: boolean;
  starting: boolean;
  sending: boolean;
  errorMessage: string;
  actionErrorMessage: string;
  showNoFinalState: boolean;
  data: FinalChatApiResponse | null;
  teamsPreview: FinalChatTeamsPreviewApiResponse | null;
}
