import './index.css';

interface Props {
  pageNumber?: number;
  totalPages?: number;
}

export const CommonFooter = ({ pageNumber, totalPages }: Props) => {
  return (
    <div className="pdf-footer">
      <div className="pdf-footer-left">© 2024 PawHaven</div>
      <div className="pdf-footer-center">pawhaven.work</div>
      <div className="pdf-footer-right">
        {pageNumber != null && totalPages != null
          ? `${pageNumber} / ${totalPages}`
          : ''}
      </div>
    </div>
  );
};
