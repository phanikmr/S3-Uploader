export const BaseURL = {
  infoLinkBaseURL: 'https://pwservicestg1.planwellcollaborate.com/Web',
  projectLinkBaseURL: 'https://pwcstg1.planwellcollaborate.com/pwpweb',
  nodeServerBaseUrl: 'http://10.10.87.47:8002',
  localNodeServerBaseUrl: 'http://localhost:8002'
};


export const API = {
  getAwsSingnature: BaseURL.nodeServerBaseUrl + '/api/awsSignature',
  getServerTime: BaseURL.nodeServerBaseUrl + '/api/serverTime',
  getAWSInfo: BaseURL.nodeServerBaseUrl + '/api/awsInfo'
};
