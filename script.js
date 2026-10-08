// =========================================================
// 바이브 카페 - 주문서 기능 스크립트
// =========================================================

// ----- Supabase 연결 정보 -----
// Supabase 프로젝트 대시보드에서 확인할 수 있는 값을 아래 두 줄에 직접 채워 넣으세요.
// (Project Settings > API 메뉴에서 "Project URL"과 "anon/publishable key"를 복사)
const SUPABASE_URL = 'https://acsohdrzvzyuqpvvdrgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_97YZPqi06zngHhkHcdAqCw_Yadx4d8p';

// supabase-js 라이브러리(index.html에서 CDN으로 불러온 전역 객체 supabase)를 이용해
// 실제로 DB와 통신할 클라이언트 객체를 하나 만들어 둔다.
// 이 supabaseClient 변수를 통해서만 Supabase와 데이터를 주고받는다.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ----- 자주 사용할 요소들을 미리 찾아서 변수에 저장 -----
const form = document.getElementById('order-form');       // 주문서 폼 전체
const nameInput = document.getElementById('name');         // 이름 입력칸
const phoneInput = document.getElementById('phone');        // 전화번호 입력칸
const drinkSelect = document.getElementById('drink');       // 음료 선택 드롭다운
const quantityInput = document.getElementById('quantity');  // 수량 입력칸
const requestInput = document.getElementById('request');    // 요청사항 입력칸
const totalPriceEl = document.getElementById('total-price'); // 예상 금액 표시 영역
const orderBtn = document.getElementById('order-btn');       // 주문하기 버튼
const resetBtn = document.getElementById('reset-btn');       // 다시 작성 버튼
const confirmMessageEl = document.getElementById('confirm-message'); // 주문 확인 메시지 영역


/**
 * 현재 선택된 음료 + 사이즈 + 추가 옵션 + 수량을 바탕으로
 * 총 금액(숫자)을 계산해서 돌려주는 함수.
 * 다른 곳에서도 이 함수 하나만 호출하면 항상 같은 방식으로 계산된다.
 */
function calculateTotal() {
  // 1. 음료를 아직 선택하지 않았다면(= value가 빈 문자열) 바로 0원 반환
  if (!drinkSelect.value) {
    return 0;
  }

  // 2. 선택된 음료의 가격 가져오기
  //    drinkSelect.selectedIndex로 현재 선택된 <option> 요소를 찾고,
  //    그 option에 적힌 data-price 값을 숫자로 변환한다.
  const selectedDrinkOption = drinkSelect.options[drinkSelect.selectedIndex];
  const drinkPrice = Number(selectedDrinkOption.dataset.price);

  // 3. 선택된 사이즈(S/M/L)의 추가 가격 가져오기
  //    name="size"인 라디오 버튼 중 체크된 것 하나를 찾는다.
  const checkedSize = document.querySelector('input[name="size"]:checked');
  const sizePrice = checkedSize ? Number(checkedSize.dataset.price) : 0;

  // 4. 체크된 추가 옵션들의 가격을 모두 더하기
  //    (.form-group 안에 있는 체크박스 중 checked 상태인 것들만 선택)
  const checkedOptions = document.querySelectorAll('.form-group input[type="checkbox"]:checked');
  let optionsPrice = 0;
  checkedOptions.forEach(function (checkbox) {
    optionsPrice += Number(checkbox.dataset.price);
  });

  // 5. 수량 가져오기 (비어있거나 이상한 값이면 1로 처리)
  const quantity = Number(quantityInput.value) || 1;

  // 6. (음료 가격 + 사이즈 추가금 + 옵션 합계) * 수량 = 최종 금액
  const total = (drinkPrice + sizePrice + optionsPrice) * quantity;

  return total;
}


/**
 * 화면의 "예상 금액" 영역 글자를 최신 금액으로 갱신하는 함수.
 * calculateTotal()로 계산한 숫자를 천 단위 콤마가 있는 문자열로 바꿔서 보여준다.
 */
function updateTotalDisplay() {
  const total = calculateTotal();
  // toLocaleString()을 쓰면 1234567 -> "1,234,567" 처럼 콤마가 자동으로 붙는다.
  totalPriceEl.textContent = '예상 금액: ' + total.toLocaleString() + '원';
}


/**
 * 체크된 추가 옵션 하나의 "가격 표시를 뺀" 이름만 가져오는 함수.
 * 예) <label for="option-shot">샷 추가 +500원</label> -> "샷 추가"
 */
function getOptionLabelText(checkbox) {
  // 체크박스의 id와 연결된 <label>을 찾는다.
  const label = document.querySelector('label[for="' + checkbox.id + '"]');
  // 라벨 글자에서 "+500원" 같은 가격 부분을 지우고 양쪽 공백을 정리한다.
  return label.textContent.replace(/\+[\d,]+원/, '').trim();
}


/**
 * 현재 선택된 음료의 "이름만" 가져오는 함수.
 * 예) <option>카페라떼 4,000원</option> -> "카페라떼"
 */
function getDrinkName() {
  const selectedDrinkOption = drinkSelect.options[drinkSelect.selectedIndex];
  // 옵션 글자에서 끝에 붙은 "3,500원" 같은 가격 부분을 지운다.
  return selectedDrinkOption.textContent.replace(/[\d,]+원\s*$/, '').trim();
}


// ----- 실시간 금액 계산: 값이 바뀔 때마다 updateTotalDisplay 실행 -----

// 음료 선택이 바뀔 때
drinkSelect.addEventListener('change', updateTotalDisplay);

// 사이즈 라디오 버튼이 바뀔 때 (S, M, L 전부)
document.querySelectorAll('input[name="size"]').forEach(function (radio) {
  radio.addEventListener('change', updateTotalDisplay);
});

// 추가 옵션 체크박스가 바뀔 때 (샷/크림/시럽/디카페인 전부)
document.querySelectorAll('.form-group input[type="checkbox"]').forEach(function (checkbox) {
  checkbox.addEventListener('change', updateTotalDisplay);
});

// 수량이 바뀔 때 (입력하는 즉시 반영되도록 input 이벤트 사용)
quantityInput.addEventListener('input', updateTotalDisplay);


/**
 * 완성된 주문 정보를 Supabase의 cafe_menu03 테이블에 저장(INSERT)하는 함수.
 * supabase-js의 .from(테이블명).insert(배열) 형태로 호출한다.
 * 성공하면 true, 실패하면 false를 돌려준다. (실패 원인은 콘솔에 출력)
 */
async function saveOrderToSupabase(order) {
  // insert()에는 "저장할 행들의 배열"을 넘겨야 하므로, 객체 하나를 배열로 감싼다.
  const { error } = await supabaseClient.from('cafe_menu03').insert([order]);

  if (error) {
    // 실패 이유(권한 문제, 컬럼명 오류 등)를 개발자가 콘솔에서 확인할 수 있게 출력
    console.error('Supabase 저장 중 오류 발생:', error);
    return false;
  }

  return true;
}


// ----- 주문하기 버튼: 폼 제출(submit) 처리 -----
form.addEventListener('submit', async function (event) {
  // 폼의 기본 동작(페이지 새로고침)을 막는다.
  event.preventDefault();

  // 1. 이름이 비어있는지 검사 (양쪽 공백만 있는 경우도 비어있는 것으로 처리)
  if (nameInput.value.trim() === '') {
    alert('이름을 입력해주세요');
    return; // 아래 코드를 실행하지 않고 함수 종료
  }

  // 2. 음료를 선택했는지 검사
  if (!drinkSelect.value) {
    alert('음료를 선택해주세요');
    return;
  }

  // 3. 여기까지 왔다면 입력값이 정상이므로 주문 확인 메시지를 만든다.

  const name = nameInput.value.trim();
  const drinkName = getDrinkName();

  // 선택된 음료 자체의 가격 (사이즈/옵션 추가금 제외한 순수 음료 가격)
  const selectedDrinkOption = drinkSelect.options[drinkSelect.selectedIndex];
  const drinkPrice = Number(selectedDrinkOption.dataset.price);

  // 체크된 사이즈의 값(S, M, L)
  const checkedSize = document.querySelector('input[name="size"]:checked');
  const sizeValue = checkedSize ? checkedSize.value : 'M';

  // 체크된 옵션들의 이름을 배열로 모으기 (메시지 표시 + DB 저장 모두에 재사용)
  const checkedOptions = document.querySelectorAll('.form-group input[type="checkbox"]:checked');
  const optionNames = [];
  checkedOptions.forEach(function (checkbox) {
    optionNames.push(getOptionLabelText(checkbox));
  });

  const quantity = Number(quantityInput.value) || 1;
  const total = calculateTotal();

  // 2-1. 두 번 클릭되는 것을 막기 위해 저장하는 동안 주문하기 버튼을 비활성화
  orderBtn.disabled = true;

  // 2-2. Supabase cafe_menu03 테이블에 주문 저장 시도
  const isSaved = await saveOrderToSupabase({
    customer_name: name,
    phone: phoneInput.value.trim() || null,
    drink: drinkName,
    drink_price: drinkPrice,
    size: sizeValue,
    options: optionNames,           // 배열 그대로 저장 (예: ["샷 추가", "시럽 추가"])
    quantity: quantity,
    request: requestInput.value.trim() || null,
    total_price: total
  });

  // 2-3. 저장 성공/실패와 상관없이 버튼은 다시 눌러야 하니 활성화 복구
  orderBtn.disabled = false;

  // 2-4. 저장에 실패했다면 알림만 띄우고, 주문 확인 메시지는 보여주지 않는다.
  if (!isSaved) {
    alert('주문 저장에 실패했어요');
    return;
  }

  // 3. 저장에 성공한 경우에만 주문 확인 메시지를 만들어서 화면에 보여준다.

  // 메시지를 조각조각 배열에 담은 뒤 공백으로 이어붙인다.
  // 옵션이 없으면 괄호 부분을 아예 배열에 넣지 않으므로 자동으로 빠지게 된다.
  const messageParts = [
    name + '님,',
    drinkName,
    sizeValue + '사이즈'
  ];

  if (optionNames.length > 0) {
    messageParts.push('(' + optionNames.join(', ') + ')');
  }

  messageParts.push(quantity + '잔,');
  messageParts.push('총 ' + total.toLocaleString() + '원');
  messageParts.push('주문이 접수되었습니다!');

  confirmMessageEl.textContent = messageParts.join(' ');
  confirmMessageEl.hidden = false; // hidden 속성을 지워서 화면에 보이게 함
});


// ----- 다시 작성 버튼: 입력값과 금액, 확인 메시지 초기화 -----
resetBtn.addEventListener('click', function () {
  // 주의: reset 버튼을 누르면 브라우저가 폼을 기본값으로 되돌리는데,
  // 그 되돌림은 이 click 이벤트 처리가 끝난 '다음'에 일어난다.
  // 그래서 setTimeout으로 한 박자 늦춰서, 값이 다 초기화된 뒤에
  // 금액 표시와 확인 메시지를 정리한다.
  setTimeout(function () {
    updateTotalDisplay();           // 예상 금액을 0원으로 다시 표시
    confirmMessageEl.hidden = true; // 주문 확인 메시지 숨기기
    confirmMessageEl.textContent = ''; // 이전 메시지 내용도 비우기
  }, 0);
});


// ----- 페이지가 처음 열렸을 때도 예상 금액을 0원으로 표시 -----
updateTotalDisplay();
