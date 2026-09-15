import { styled } from 'styled-components';

const Container = styled.div`
  font-size: 14px;
  text-align: right;
  width: 100%;
  margin: 20px 40px;
  padding: 10px 0;
  border-top: 1px solid #c0c0c0;
  .page {
    margin-right: 10px;
  }
`;
export const CommonFooter = () => {
  return (
    <Container>
      <span className="page">Page</span>
      <span className="pageNumber"></span>/<span className="totalPages"></span>
    </Container>
  );
};
