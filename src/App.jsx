import FlipBookViewer from './components/FlipbookViewer';
import { ToastProvider } from './components/ui/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <FlipBookViewer />
    </ToastProvider>
  );
}

export default App;
