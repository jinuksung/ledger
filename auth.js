import { supabase } from './supabase.js';

export const logOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error);
    }
    sessionStorage.removeItem('currentLedgerId');
    location.href = './signIn.html';
  } catch (error) {
    alert(error);
  }
};
