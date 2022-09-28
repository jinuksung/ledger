import { supabase } from './supabase.js';

const signUpForm = document.forms[0];
const passwordInput = document.querySelector('#password');
const confirmPasswordInput = document.querySelector('#confirmPassword');
let errorMessage = '';

checkPassword();

signUpForm.addEventListener('submit', signUp);

function checkPassword() {
  const passwordCheckSpan = document.createElement('span');
  passwordCheckSpan.classList.add('passwordCheckSpan');
  confirmPasswordInput.insertAdjacentElement('afterend', passwordCheckSpan);

  passwordInput.addEventListener('input', (e) => {
    const { target } = e;
    if (target.value == '' && passwordInput.value == '') {
      passwordCheckSpan.textContent = '';
      confirmPasswordInput.classList.remove('is-danger');
    }
  });

  confirmPasswordInput.addEventListener('input', (e) => {
    const { target } = e;
    if (target.value == '' && passwordInput.value == '') {
      confirmPasswordInput.classList.remove('is-danger');
    } else if (target.value !== passwordInput.value) {
      passwordCheckSpan.textContent = '비밀번호가 일치하지 않습니다.';
      confirmPasswordInput.classList.add('is-danger');
    } else if (target.value !== '' && target.value === passwordInput.value) {
      passwordCheckSpan.textContent = '';
      confirmPasswordInput.classList.remove('is-danger');
    }
  });
}

async function signUp(e) {
  e.preventDefault();
  console.log(e);
  const { target } = e;

  try {
    const errorNotification = document.querySelector('.notification');
    if (errorNotification != null) {
      errorNotification.remove();
    }

    if (target[0].value == '' || target[1].value == '' || target[2].value == '') {
      throw new Error('입력하지 않은 값이 있습니다.');
    } else if (target[1].value !== target[2].value) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    } else {
      const { user, session, error } = await supabase.auth.signUp({
        email: target[0].value,
        password: target[1].value,
      });
      console.log(user);
      console.log(session);
      if (error !== null) {
        console.log(error);
        const { message } = error;
        throw new Error(message);
      }
      alert('회원가입에 성공하였습니다. 로그인해주세요.');
      location.replace('./signIn.html');
    }
  } catch (error) {
    console.log(error);
    errorMessage = `
    <div class="notification is-danger is-light">
    <p>Error</p>
    <span>${error.message}</span>
  </div>`;
    signUpForm.insertAdjacentHTML('beforeend', errorMessage);
  }
}
