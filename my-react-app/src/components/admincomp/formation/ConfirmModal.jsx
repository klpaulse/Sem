export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-modal__overlay">
      <div className="confirm-modal">
        <h3 className="confirm-modal__title">{title}</h3>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button
            onClick={onCancel}
            className="confirm-modal__cancel"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            className="confirm-modal__confirm"
          >
            Ja, lagre
          </button>
        </div>
      </div>
    </div>
  );
}