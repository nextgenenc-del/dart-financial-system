// DART API와 통신하는 서버리스 함수

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { company, year, reportType, fsDiv } = req.query;
  
  // 환경변수에서 API 키 가져오기
  const API_KEY = process.env.DART_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'API 키가 설정되지 않았습니다.' 
    });
  }

  if (!company || !year) {
    return res.status(400).json({ 
      error: '필수 파라미터가 누락되었습니다.' 
    });
  }

  try {
    console.log('DART API 호출 시작:', { company, year, reportType, fsDiv });
    
    // DART Open API 호출
    const dartUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json`;
    const params = new URLSearchParams({
      crtfc_key: API_KEY,
      corp_code: company,
      bsns_year: year,
      reprt_code: reportType || '11011',  // 기본값: 사업보고서
      fs_div: fsDiv || 'CFS'               // 기본값: 연결재무제표
    });

    const response = await fetch(`${dartUrl}?${params}`);
    const data = await response.json();
    
    console.log('DART API 응답:', data.status, data.message);
    
    // 데이터 가공
    if (data.status === '000' && data.list) {
      // 주요 계정과목 추출
      const processedData = {
        status: '000',
        message: '정상 조회',
        company_code: company,
        year: year,
        list: data.list,
        summary: extractFinancialSummary(data.list)
      };
      
      return res.status(200).json(processedData);
    } else {
      return res.status(200).json({
        status: data.status,
        message: data.message || '데이터가 없습니다.',
        company_code: company,
        year: year,
        list: []
      });
    }
    
  } catch (error) {
    console.error('DART API 호출 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// 재무 요약 정보 추출 함수
function extractFinancialSummary(list) {
  const findAccount = (keywords) => {
    for (const keyword of keywords) {
      const item = list.find(i => 
        i.account_nm && i.account_nm.includes(keyword)
      );
      if (item) return parseInt(item.thstrm_amount) || 0;
    }
    return null;
  };

  return {
    // 손익계산서 항목
    sales: findAccount(['매출액', '수익', '영업수익']),
    operatingProfit: findAccount(['영업이익', '영업손익']),
    netIncome: findAccount(['당기순이익', '당기순손익']),
    
    // 재무상태표 항목
    totalAssets: findAccount(['자산총계', '자산 총계']),
    currentAssets: findAccount(['유동자산']),
    nonCurrentAssets: findAccount(['비유동자산']),
    totalLiabilities: findAccount(['부채총계', '부채 총계']),
    currentLiabilities: findAccount(['유동부채']),
    nonCurrentLiabilities: findAccount(['비유동부채']),
    totalEquity: findAccount(['자본총계', '자본 총계']),
    
    // 현금흐름표 항목
    operatingCashFlow: findAccount(['영업활동현금흐름', '영업활동으로인한현금흐름']),
    investingCashFlow: findAccount(['투자활동현금흐름', '투자활동으로인한현금흐름']),
    financingCashFlow: findAccount(['재무활동현금흐름', '재무활동으로인한현금흐름'])
  };
}
