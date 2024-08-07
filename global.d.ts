/* eslint-disable no-unused-vars */
/* eslint-disable lines-around-comment */
import en from './src/locales/en.json';

type Messages = typeof en;

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
