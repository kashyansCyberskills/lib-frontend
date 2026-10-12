import { formatDate } from "./api";

// The status of a loan, drawn like the date stamp inside a library book.
function StatusStamp({ record }) {
      if (record.status === "RETURNED") {
            return <span className="stamp returned">Returned {formatDate(record.returnDate)}</span>;
      }
      if (record.overdue) {
            return <span className="stamp overdue">Overdue since {formatDate(record.dueDate)}</span>;
      }
      return <span className="stamp issued">Due {formatDate(record.dueDate)}</span>;
}

export default StatusStamp;
