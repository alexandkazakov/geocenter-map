import styles from "./styles.module.css";

export const Button = ({ isActive, onClick, children }) => {
  return (
    <button className={`${styles.Button} ${isActive && styles["Button--active"]}`} onClick={onClick}>
      {children}
    </button>
  );
};
