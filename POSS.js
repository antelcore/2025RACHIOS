function updatePOSSystem() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const formSheet = sheet.getSheetByName('폼 응답');
    const timerSheet = sheet.getSheetByName('타이머');
    const orderSheet = sheet.getSheetByName('주문 처리');
  
    const data = formSheet.getDataRange().getValues();
    const entries = data.slice(1); // 응답 데이터
  
    // === 세트 구성 정보 불러오기 (주문 처리 탭 H열~)
    const setMenuRange = orderSheet.getRange(1, 8, orderSheet.getLastRow(), 20).getValues();
    const setMenus = {};
    setMenuRange.forEach(row => {
      const setName = row[0];
      if (setName) {
        setMenus[setName] = row.slice(1).filter(cell => cell);
      }
    });
  
    // === 타이머 탭 ===
    const latestOrders = {};
    entries.forEach(row => {
      const timestamp = new Date(row[0]);
      const tableNum = row[2];
      const orderType = row[1];
      if (orderType === '최초 주문') {
        if (!latestOrders[tableNum] || latestOrders[tableNum] < timestamp) {
          latestOrders[tableNum] = timestamp;
        }
      }
    });
  
    timerSheet.clear();
    timerSheet.appendRow(['테이블번호', '최신 최초 주문 시간', '경과시간', '상태']);
  
    const now = new Date();
    Object.entries(latestOrders).forEach(([table, time]) => {
      const diffMins = Math.floor((now - time) / 1000 / 60);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      const elapsedText = `${hours}시간 ${minutes}분`;
      const status = (diffMins >= 120) ? '시간초과' : '이용중';
      timerSheet.appendRow([table, time, elapsedText, status]);
    });
  
    // === 주문 처리 탭 ===
    orderSheet.getRange('A2:G').clear(); // 주문 데이터 영역만 초기화
    orderSheet.getRange('A1:G1').setValues([['시간', '테이블번호', '메뉴', '수량', '입금확인', '조리시작', '서빙완료']]);
  
    entries.forEach(row => {
      const timestamp = new Date(row[0]);
      const tableNum = row[2];
      const timeStr = Utilities.formatDate(timestamp, 'Asia/Seoul', 'HH:mm');
  
      for (let i = 3; i < row.length; i += 2) {
        const menu = String(row[i]).trim();
        const qty = row[i + 1] || 1;
  
        if (menu === '') continue;
  
        if (setMenus[menu]) {
          // 세트로 매핑된 메뉴들 각각 추가
          setMenus[menu].forEach(mapped => {
            orderSheet.appendRow([timeStr, tableNum, mapped, qty, false, false, false]);
          });
        } else {
          // 단일 메뉴
          orderSheet.appendRow([timeStr, tableNum, menu, qty, false, false, false]);
        }
      }
    });
  
    // 체크박스 삽입
    const lastRow = orderSheet.getLastRow();
    if (lastRow > 1) {
      orderSheet.getRange(2, 5, lastRow - 1, 3).insertCheckboxes();
    }
  
    // 조건부 서식 적용
    setConditionalFormatting(timerSheet, orderSheet, lastRow);
  }
  