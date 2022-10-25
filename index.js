import { supabase } from './supabase.js';
import { logOut } from './auth.js';

const ledgerSelectModal = document.querySelector('#ledgerSelectModal');
const ledgerTable = document.querySelector('#ledgerTable');
const registerBtn = document.querySelector('#registerBtn');
const modalOverlay = document.querySelector('.modalOverlay');
const registerForm = document.registerForm;
const dateInput = document.querySelector('#date');
const amountInput = document.querySelector('#amount');
const logOutBtn = document.querySelector('.logOut');
const closeModalBtn = document.querySelector('.closeModal');
const accountType = document.querySelector('#accountType');
const accountName = document.querySelector('#accountName');
let ledgerId = null;
let currentUser = null;

//처음에 fetchData 수행 시 sessionStorage에 현재 가계부 ID를 저장해놓음.
//페이지 새로고침 될 때마다 sessionStoarge에 현재 가계부 ID가 있는지 확인함.
//ID가 있으면 해당 ID로 계속 불러오고, 없으면 가계부 선택하는 모달 뜸.
if (!sessionStorage.currentLedgerId) {
  loadLedgerList();
  console.log('there is no token');
} else {
  fetchData(sessionStorage.currentLedgerId);
  console.log('there is a token');
}

//database에서 로그인한 사용자가 사용 중인 가계부 목록 조회하여 보여주는 함수
async function loadLedgerList() {
  try {
    const session = await supabase.auth.getSession();
    console.log('session :', session);
    console.log('session.user.email :', session.data.session.user.email);
    currentUser = session.data.session.user.email;
    const user1 = await supabase.from('ledger_list').select('id, ledger_name, user1, created_at').eq('user1', currentUser);
    const user2 = await supabase.from('ledger_list').select('id, ledger_name, user2, created_at').eq('user2', currentUser);
    const user3 = await supabase.from('ledger_list').select('id, ledger_name, user3, created_at').eq('user3', currentUser);
    const user4 = await supabase.from('ledger_list').select('id, ledger_name, user4, created_at').eq('user4', currentUser);
    const user5 = await supabase.from('ledger_list').select('id, ledger_name, user5, created_at').eq('user5', currentUser);
    Promise.all([user1, user2, user3, user4, user5])
      .then((results) => {
        console.log('results :', results);
        const ledgerListArray = results.filter((result) => result.data.length > 0);
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
          ledger.push(...ledgerList.data);
          ledger.sort(function (a, b) {
            return a.id - b.id;
          });
        });
        return ledger;
      })
      .then((ledger) => {
        console.log('ledger :', ledger);
        ledger.forEach((ledgerCell) => {
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
          ledgerId = target.parentElement.firstElementChild.textContent;
          ledgerSelectModal.classList.add('hidden');
          modalOverlay.classList.add('hidden');
          sessionStorage.currentLedgerId = ledgerId;
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
        modalOverlay.classList.remove('hidden');
        ledgerSelectModal.classList.remove('hidden');
        ledgerSelectTable.insertAdjacentHTML('beforeend', ledgerListRow);
        ledgerSelectModal.insertAdjacentElement('beforeend', ledgerSelectTable);
      });
  } catch (error) {
    console.error(error);
  }
}

//내역 등록하기 버튼 클릭 시 registerModal 실행 및 날짜 기본값 오늘 날짜로 세팅
registerBtn.addEventListener('click', function () {
  //toISOString의 경우 UTC 시간을 기준으로 시간대를 반환, 한국과는 9시간 차이가 있음.
  //따라서 offset을 반영해줘야 함
  const offSet = new Date().getTimezoneOffset() * 60000;
  modalOverlay.classList.remove('hidden');
  registerForm.classList.remove('hidden');
  document.body.style.overflowY = 'hidden';
  dateInput.value = new Date(Date.now() - offSet).toISOString().substring(0, 10);
  let accountTypeArray = '';
  accountTypeLoad().then((results) => {
    accountTypeArray = results;
    console.log('accountTypeArray :', accountTypeArray);
    results.forEach((result) => {
      const option = `<option value="${result}">${result}</option>`;
      accountType.insertAdjacentHTML('beforeend', option);
    });
  });
  accountNameLoad('포인트').then((results) => {
    console.log(results);
    results.forEach((result) => {
      const option = `<option value="${result.account_name}">${result.account_name}</option>`;
      accountName.insertAdjacentHTML('beforeend', option);
    });
  });
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
//accounttype이 바뀔 때마다 accountname의 목록들도 바꿔주는 함수
//바뀔 때마다 목록 초기화되고 바꿔져야 함(지금은 바꿀 때마다 초기화 안되고 계속 뒤에 붙기만 함)
accountType.addEventListener('change', function (e) {
  const { target } = e;
  accountNameLoad(`${target.value}`).then((results) => {
    results.forEach((result) => {
      const option = `<option value="${result.account_name}">${result.account_name}</option>`;
      accountName.insertAdjacentHTML('beforeend', option);
    });
  });
});

//Modals에서 닫기버튼 누르면 창 닫힘
closeModalBtn.addEventListener('click', function () {
  modalOverlay.classList.add('hidden');
  registerForm.classList.add('hidden');
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
    ledger_id: ledgerId,
    writer: currentUser,
  };
  //supabase database에 내역 등록하는 함수
  registerData(newLedger);
  //modal 항목들의 기본값 초기화
  registerForm[0].value = '';
  registerForm[1].value = '';
  registerForm[2].value = '';
  registerForm[3].value = '';
  registerForm[4].value = '';
  registerForm[5].value = '';
  //modal hidden 처리 및 scroll lock 해제
  modalOverlay.classList.add('hidden');
  registerForm.classList.add('hidden');
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
    const { data, error } = await supabase
      .from('ledger_detail3')
      .select(
        `
      id,
      date,
      account_list (
        account_type,
        account_name
      ),
      revenue_cost_list (
        level_one,
        level_two
      ),
      description,
      amount
      `
      )
      .eq('ledger_id', ledgerId);
    if (data) {
      console.log('data:', data);
      const tableHeader = `
      <tr>
          <th>날짜</th>
          <th>통장</th>
          <th>수익/비용</th>
          <th>상세</th>
          <th>금액</th>
          <th>내용</th>
          <th>작성자</th>
          <th>삭제/수정</th>
        </tr>
      `;
      ledgerTable.insertAdjacentHTML('afterbegin', tableHeader);
      data.forEach((datum) => ledgerLoad(datum));
    } else if (error) {
      throw new Error(error);
    }
  } catch (e) {
    console.error(e);
  }
}

//모델에서 데이터 불러와서 화면에 뿌려주는 함수
function ledgerLoad(data) {
  const { id, date, description, amount, account_list, revenue_cost_list } = data;
  let ledgerCell = '';
  if ((revenue_cost_list.level_one = '비용')) {
    ledgerCell = `
  <tr class=${id}>
  <td>${date.slice(5, 7)}/${date.slice(8, 10)}</td>
  <td>${account_list.account_type} ${account_list.account_name}</td>
  <td class="cost">${revenue_cost_list.level_one}</td>
  <td class="cost">${revenue_cost_list.level_two}</td>
  <td class="cost">${amount.toLocaleString('KO-KR')}</td>
  <td>${description}</td>
  <td class="writer"></td>
  <td class="edit"></td>
  </tr>
  `;
  } else if ((revenue_cost_list.level_one = '수익')) {
    ledgerCell = `
    <tr class=${id}>
    <td>${date.slice(5, 7)}/${date.slice(8, 10)}</td>
    <td>${account_list.account_type} ${account_list.account_name}</td>
    <td class="revenue">${revenue_cost_list.level_one}</td>
    <td class="revenue">${revenue_cost_list.level_two}</td>
    <td class="revenue">${amount.toLocaleString('KO-KR')}</td>
    <td>${description}</td>
    <td class="writer"></td>
    <td class="edit"></td>
    </tr>
    `;
  }
  ledgerTable.insertAdjacentHTML('beforeend', ledgerCell);
}

//로그아웃 함수
// logOutBtn.addEventListener('click', () => {
//   logOut();
// });

async function accountTypeLoad() {
  try {
    const { data, error } = await supabase.rpc('accounttypeload');
    if (data) {
      return data;
    } else if (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.log(error);
  }
}

async function accountNameLoad(accountType) {
  try {
    const { data, error } = await supabase.from('account_list').select('account_type, account_name').eq('account_type', `${accountType}`);
    if (data) {
      return data;
    } else if (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.log(error);
  }
}
