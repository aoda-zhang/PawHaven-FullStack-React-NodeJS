import * as React from 'react';
import './index.css';

interface Props {
  pageNumber?: number;
  totalPages?: number;
}

export const CommonFooter: React.FC<Props> = ({ pageNumber, totalPages }) => {
  return (
    <div className="pdf-footer">
      <div className="pdf-footer-left">© 2024 PawHaven</div>
      <div className="pdf-footer-center">pawhaven.work</div>
      <div className="pdf-footer-right">
        {pageNumber} / {totalPages}
      </div>
    </div>
  );
};
