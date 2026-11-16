import Icon from './Icon'

export default function Loader({ error, onRetry }) {
  return (
    <div className="site-loader">
      {error ? (
        <div className="site-loader__error">
          <Icon name="alert" size={32} />
          <h2>We couldn’t load the website</h2>
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={onRetry}>Try again</button>
        </div>
      ) : (
        <>
          <span className="site-loader__bolt"><Icon name="zap" size={30} /></span>
          <span className="site-loader__bar"><i /></span>
        </>
      )}
    </div>
  )
}
