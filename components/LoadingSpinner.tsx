import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
  subMessage?: string
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false, subMessage }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className={styles.fullScreenContainer}>
        <div className={styles.spinnerWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.message}>{message}</p>
          {subMessage && <p className={styles.subMessage}>{subMessage}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
      {subMessage && <p className={styles.subMessage}>{subMessage}</p>}
    </div>
  )
}
