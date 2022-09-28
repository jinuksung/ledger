import { supabase } from './supabase.js';

loadLedgerList();

async function loadLedgerList() {
  try {
    const session = await supabase.auth.session();
    console.log('session :', session);
    console.log('session.user.email :', session.user.email);
    const userEmail = session.user.email;
    const user1 = await supabase.from('ledger_list').select('id, ledger_name, user1, created_at').eq('user1', userEmail);
    const user2 = await supabase.from('ledger_list').select('id, ledger_name, user2, created_at').eq('user2', userEmail);
    const user3 = await supabase.from('ledger_list').select('id, ledger_name, user3, created_at').eq('user3', userEmail);
    const user4 = await supabase.from('ledger_list').select('id, ledger_name, user4, created_at').eq('user4', userEmail);
    const user5 = await supabase.from('ledger_list').select('id, ledger_name, user5, created_at').eq('user5', userEmail);
    Promise.all([user1, user2, user3, user4, user5])
      .then((results) => {
        console.log('results :', results);
        const ledgerListArray = results.filter((result) => result.body.length > 0);
        if (ledgerListArray.length > 0) {
          return ledgerListArray;
        } else {
          throw new Error('작성 중인 가계부가 없습니다.'); //수정해야 함
        }
      })
      .catch()
      .then((ledgerListArray) => {
        let ledger = [];
        console.log('ledgerList :', ledgerListArray);
        ledgerListArray.forEach((ledgerList) => {
          ledger.push(...ledgerList.body);
        });
        return ledger;
      })
      .then((ledger) => {
        console.log('ledger :', ledger);
        ledger.forEach((ledgerCell) => {
          // console.log(Object.keys(ledgerCell)[2]);
          if (Object.keys(ledgerCell)[2] === 'user1') {
            ledgerCell.userType = '생성자';
          } else if (Object.keys(ledgerCell)[2] != 'user1') {
            ledgerCell.userType = '참여자';
          }
        });
        console.log(ledger);
        return ledger;
      })
      .then((ledger) => {
        const ledgerSelectTable = document.createElement('table');
        ledgerSelectTable.setAttribute('class', 'table');
        const tr = document.createElement('tr');
        const th1 = document.createElement('th');
        const th2 = document.createElement('th');
        const th3 = document.createElement('th');
        ledgerSelectTable.addEventListener('click', function (e) {
          const { target } = e;
          const ledgerId = target.parentElement.firstElementChild.textContent;
          ledgerSelectModal.classList.add('hidden');
          ledgerSelectModalOverlay.classList.add('hidden');
          fetchData(ledgerId);
        });

        th1.textContent = '번호';
        th2.textContent = '가계부명';
        th3.textContent = '사용자유형';

        tr.append(th1, th2, th3);
        ledgerSelectTable.append(tr);

        const ledgerListRow = ledger
          .map(
            (ledgerCell) => `
          <tr>
            <td>${ledgerCell.id}</td>
            <td>${ledgerCell.ledger_name}</td>
            <td>${ledgerCell.userType}</td>
          </tr>
        `
          )
          .join('');
        ledgerSelectTable.insertAdjacentHTML('beforeend', ledgerListRow);
        ledgerSelectModal.insertAdjacentElement('beforeend', ledgerSelectTable);
      });
  } catch (error) {
    console.log(error);
  }
}

const main = document.querySelector('main');
const ledgerSelectModal = document.querySelector('#ledgerSelectModal');
const ledgerSelectModalOverlay = document.querySelector('#ledgerSelectModalOverlay');
const table = document.querySelector('table');
const registerBtn = document.querySelector('#registerBtn');
const modalOverlay = document.querySelector('.modalOverlay');
const modal = document.querySelector('.modals');
const registerForm = document.registerForm;
const dateInput = document.querySelector('#date');
const amountInput = document.querySelector('#amount');
const logOut = document.querySelector('#logOut');
const closeModalBtn = document.querySelector('.closeModal');

//내역 등록하기 버튼 클릭 시 registerModal 실행 및 날짜 기본값 오늘 날짜로 세팅
registerBtn.addEventListener('click', function () {
  //toISOString의 경우 UTC 시간을 기준으로 시간대를 반환, 한국과는 9시간 차이가 있음.
  //따라서 offset을 반영해줘야 함
  const offSet = new Date().getTimezoneOffset() * 60000;
  modalOverlay.classList.remove('hidden');
  modal.classList.remove('hidden');
  document.body.style.overflowY = 'hidden';
  dateInput.value = new Date(Date.now() - offSet).toISOString().substring(0, 10);
});

//registerModal에서 금액 입력 시 컴마 적용해줌
amountInput.addEventListener('keyup', function (e) {
  let value = e.target.value;
  value = Number(value.replaceAll(',', ''));
  console.log(value);
  if (isNaN(value)) {
    alert('숫자만 입력해 주세요');
    amountInput.value = '';
  } else {
    amountInput.value = value.toLocaleString('KO-KR');
  }
});

//Modals에서 닫기버튼 누르면 창 닫힘

closeModalBtn.addEventListener('click', function () {
  modalOverlay.classList.add('hidden');
  modal.classList.add('hidden');
  document.body.style.overflowY = 'scroll';
});

closeModalBtn.addEventListener('click', function (e) {
  console.log(e);
});

//registerForm 작성 후 submit 시 submitForm 함수 실행
registerForm.addEventListener('submit', submitForm);

async function submitForm(e) {
  const { target } = e;
  e.preventDefault();
  console.dir(target);
  const newLedger = {
    date: target[0].value,
    account: target[1].value,
    typeOne: target[2].value,
    typeTwo: target[3].value,
    amount: Number(target[4].value.replaceAll(',', '')),
    description: target[5].value,
  };
  //supabase database에 내역 등록하는 함수
  registerData(newLedger);
  //modal 항목들의 기본값 초기화
  modal[0].value = '';
  modal[1].value = '';
  modal[2].value = '';
  modal[3].value = '';
  modal[4].value = '';
  modal[5].value = '';
  //modal hidden 처리 및 scroll lock 해제
  modalOverlay.classList.add('hidden');
  modal.classList.add('hidden');
  document.body.style.overflowY = 'scroll';
}

async function registerData(ledgerData) {
  try {
    const { data, error } = await supabase.from('ledger_detail').insert([ledgerData]);
    if (data) {
      console.log(data);
      data.forEach((datum) => ledgerLoad(datum));
    } else if (error) {
      throw error;
    }
  } catch (e) {
    console.error(e);
  }
}

async function fetchData(ledgerId) {
  try {
    const { data, error } = await supabase.from('ledger_detail').select('*').eq('ledger_id', ledgerId);
    if (data) {
      console.log('data:', data);
      data.forEach((datum) => ledgerLoad(datum));
    } else if (error) {
      const { message } = error;
      throw new Error(message);
    }
  } catch (e) {
    console.error(e);
  }
}

//모델에서 데이터 불러와서 화면에 뿌려주는 함수
function ledgerLoad(data) {
  const { id, date, account, typeOne, typeTwo, description, amount } = data;
  const tableRow = document.createElement('tr');
  const dateCell = document.createElement('td');
  const accountCell = document.createElement('td');
  const typeOneCell = document.createElement('td');
  const typeTwoCell = document.createElement('td');
  const amountCell = document.createElement('td');
  const descriptionCell = document.createElement('td');
  tableRow.className = id;
  amountCell.classList.add('amount');
  descriptionCell.classList.add('description');
  dateCell.textContent = `${date.slice(5, 7)}/${date.slice(8, 10)}`;
  accountCell.textContent = account;
  typeOneCell.textContent = typeOne;
  typeTwoCell.textContent = typeTwo;
  amountCell.textContent = amount.toLocaleString('KO-KR');
  descriptionCell.textContent = description;

  revenueOrCost(amountCell, typeOneCell);

  table.append(tableRow);
  tableRow.append(dateCell, accountCell, typeOneCell, typeTwoCell, amountCell, descriptionCell);
}

//비용, 수익 여부에 따라 글자 색상 부여하는 함수
function revenueOrCost(a, b) {
  if (b.textContent === '비용') {
    a.classList.add('cost');
    b.classList.add('cost');
  } else if (b.textContent === '수익') {
    a.classList.add('revenue');
    b.classList.add('revenue');
  }
}

//로그아웃 함수
logOut.addEventListener('click', async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error);
    }
    location.href = './signIn.html';
  } catch (error) {
    alert(error);
  }
});
