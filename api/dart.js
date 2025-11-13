// api/dart.js
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { company, year, reportType = '11011', fsDiv = 'CFS' } = req.query;
    
    // API 키 확인
    const API_KEY = process.env.DART_API_KEY;
    
    if (!API_KEY) {
      return res.status(200).json({ 
        error: true,
        message: 'DART API 키가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.',
        status: '999'
      });
    }

    // 파라미터 확인
    if (!company || !year) {
      return res.status(200).json({ 
        error: true,
        message: '필수 파라미터(company, year)가 누락되었습니다.',
        status: '100'
      });
    }

    // DART API 호출
    const dartUrl = 'https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json';
    const params = new URLSearchParams({
      crtfc_key: API_KEY,
      corp_code: company,
      bsns_year: year,
      reprt_code: reportType,
      fs_div: fsDiv
    });

    const dartResponse = await fetch(`${dartUrl}?${params}`);
    const data = await dartResponse.json();
    
    // 응답 처리
    if (data.status === '000') {
      // 성공
      const summary = data.list ? extractSummary(data.list) : {};
      
      return res.status(200).json({
        status: '000',
        message: '정상 조회',
        company_code: company,
        year: year,
        list: data.list || [],
        summary: summary
      });
    } else {
      // 에러 상태
      const errorMessages = {
        '010': 'API 키가 등록되지 않았습니다',
        '011': '사용할 수 없는 API 키입니다',
        '013': '조회된 데이터가 없습니다',
        '020': '요청 제한을 초과했습니다',
        '100': '필수 파라미터가 누락되었습니다',
        '800': '시스템 점검 중입니다',
        '900': '시스템 장애가 발생했습니다'
      };
      
      return res.status(200).json({
        status: data.status,
        message: errorMessages[data.status] || data.message || '알 수 없는 오류',
        company_code: company,
        year: year
      });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(200).json({ 
      error: true,
      message: '서버 오류가 발생했습니다',
      details: error.message 
    });
  }
}

function extractSummary(list) {
  const findAmount = (keywords) => {
    for (const keyword of keywords) {
      const item = list.find(item => 
        item.account_nm && item.account_nm.includes(keyword)
      );
      if (item && item.thstrm_amount) {
        const amount = parseInt(item.thstrm_amount.replace(/,/g, ''));
        return isNaN(amount) ? null : amount;
      }
    }
    return null;
  };

  const totalAssets = findAmount(['자산총계', '자산 총계']);
  const totalLiabilities = findAmount(['부채총계', '부채 총계']);
  const totalEquity = findAmount(['자본총계', '자본 총계']);
  const netIncome = findAmount(['당기순이익', '순이익']);
  
  return {
    sales: findAmount(['매출액', '매출', '수익']),
    operatingProfit: findAmount(['영업이익']),
    netIncome: netIncome,
    totalAssets: totalAssets,
    totalLiabilities: totalLiabilities,
    totalEquity: totalEquity,
    debtRatio: totalAssets && totalLiabilities ? 
      ((totalLiabilities / totalAssets) * 100).toFixed(2) : null,
    roe: totalEquity && netIncome ? 
      ((netIncome / totalEquity) * 100).toFixed(2) : null
  };
}
