export type ColorMode = 'light' | 'dark' | 'system';
export type ResolvedColorMode = 'light' | 'dark';

export interface ThemeColors {
    background_main: string;
    background_primary: string;
    background_secondary: string;
    button_background_secondary: string;
    header_bg: string;
    text_primary: string;
    text_secondary: string;
    border_primary: string;
    border_secondary: string;
    card_action_icon_primary: string;
    card_action_icon_danger: string;
    action_primary: string;
    spinner_primary: string;
    buy_action_bg: string;
    sell_action_bg: string;
    gain: string;
    loss: string;
    status_success: string;
    status_success_bg: string;
    status_success_border: string;
    status_danger: string;
    status_danger_bg: string;
    status_danger_border: string;
    status_info: string;
    status_info_bg: string;
    status_info_border: string;
    pnl_positive: string;
    pnl_positive_bg: string;
    pnl_positive_border: string;
    pnl_negative: string;
    pnl_negative_bg: string;
    pnl_negative_border: string;
}
