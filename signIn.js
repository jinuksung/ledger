import { supabase } from './supabase.js';

const signInForm = document.forms[0];
let errorMessage = '';

signInForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { target } = e;
  try {
    const errorNotification = document.querySelector('.notification');

    if (errorNotification != null) {
      errorNotification.remove();
    }
    const { user, session, error } = await supabase.auth.signInWithPassword({
      email: target[0].value,
      password: target[1].value,
    });
    console.log('user :', user);
    console.log('session :', session);
    if (error != null) {
      const { message } = error;
      throw new Error(message);
    }
    location.href = './index.html';
  } catch (error) {
    console.log(error);
    errorMessage = `
    <div class="notification">
    <p>Error</p>
    <span>${error.message}</span>
  </div>`;
    signInForm.insertAdjacentHTML('afterend', errorMessage);
  }
});
