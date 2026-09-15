import { styled } from 'styled-components';
// import i18n from '@i18n/i18n.config';

const Container = styled.div`
  display: flex;
  aling-items: center;
  justify-content: space-between;
  .left {
    display: flex;
    align-item: center;
    font-size: 20px;
    .logo {
      width: 20px;
      height: 20px;
    }
  }
  .right {
    font-size: 20px;
  }
`;

interface CommonHeaderProps {
  logoUrl: string;
  title?: string;
  slogan?: string;
}

export const CommonHeader = ({ logoUrl, title, slogan }: CommonHeaderProps) => {
  return (
    <Container>
      <div className="left">
        <img className="logo" src={logoUrl} alt="header" />
        <span className="brand">{title ?? i18n.__('common.brand')}</span>
        <span className="slogan">{slogan ?? i18n.__('common.slogan')}</span>
      </div>
      <div className="right">Test</div>
    </Container>
  );
};
