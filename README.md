# 주요 시공사 재무현황 집계 시스템

DART Open API를 활용한 한국 주요 건설사 재무 데이터 수집 시스템

## 기능
- 주요 건설사 10개 기업 재무 데이터 조회
- 2020-2023년 데이터 지원
- Excel 다운로드 기능
- 실시간 DART API 연동

## 기술 스택
- Frontend: HTML, Tailwind CSS, JavaScript
- Backend: Vercel Serverless Functions
- API: DART Open API
- Deployment: Vercel

## 설치 및 실행
1. 저장소 클론
2. Vercel CLI 설치: `npm i -g vercel`
3. 환경변수 설정: `vercel env add DART_API_KEY`
4. 로컬 실행: `vercel dev`
5. 배포: `vercel --prod`
