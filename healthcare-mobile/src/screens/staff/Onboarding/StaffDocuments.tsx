import { useCallback, useState, useRef } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  pick,
  types,
  errorCodes,
  isErrorWithCode,
} from '@react-native-documents/picker';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { uploadStaffDocument } from '../../../api/staffDocuments';
import {
  DOCUMENT_TYPES,
  type StaffDocument,
  type StaffDocumentType,
} from '../../../types/staffOnboarding.types';
import { useAppSelector } from '../../../store';
import { useStaffAccess } from './StaffAccess';
import {
  FlowForm,
  FlowButton,
  FlowError,
  flowStyles,
} from '../../../components/FlowForm';

export function StaffDocuments() {
  const userId = useAppSelector(s => s.auth.user?.id);
  const access = useStaffAccess();
  const { refresh } = access;
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [documentType, setDocumentType] = useState<StaffDocumentType>('CNIC');
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    if (!userId) return;
    const token = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ data: StaffDocument[] }>(
        API.STAFF.DOCUMENTS(userId),
      );
      if (token === sequence.current) setDocuments(data.data);
    } catch (err) {
      if (token === sequence.current) setError(extractApiError(err));
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, [userId]);
  useFocusEffect(
    useCallback(() => {
      void load();
      void refresh();
      return () => {
        sequence.current++;
      };
    }, [load, refresh]),
  );
  const upload = async () => {
    if (!userId || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const [file] = await pick({
        type: [types.pdf, types.images],
        mode: 'open',
      });
      if (!file?.type || file.size == null)
        throw new Error(
          'Could not read the file type or size. Choose a different file.',
        );
      await uploadStaffDocument(userId, documentType, {
        uri: file.uri,
        name: file.name ?? 'verification-document',
        type: file.type,
        size: file.size,
      });
      setMessage(
        'Document submitted for admin review. Previous documents are retained.',
      );
      await load();
      await access.refresh();
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED)
        setError(
          err instanceof Error && !('response' in err)
            ? err.message
            : extractApiError(err),
        );
    } finally {
      setBusy(false);
    }
  };
  return (
    <FlowForm title="Verification documents">
      <Text style={flowStyles.label}>
        Staff status: {access.profile?.verificationStatus ?? 'Checking…'}
      </Text>
      <FlowError message={access.error} />
      <Text style={flowStyles.body}>
        Upload CNIC, degree and license as applicable to your role. Admin
        reviews each document and your overall verification separately. PDF,
        JPEG or PNG, up to 10 MB.
      </Text>
      {DOCUMENT_TYPES.map(type => (
        <Pressable
          key={type}
          accessibilityRole="button"
          accessibilityState={{ selected: type === documentType }}
          disabled={busy}
          style={[
            flowStyles.option,
            type === documentType && flowStyles.selected,
          ]}
          onPress={() => setDocumentType(type)}
        >
          <Text style={flowStyles.body}>
            {type === documentType ? '✓ ' : ''}
            {type.replace(/_/g, ' ')}
          </Text>
        </Pressable>
      ))}
      <FlowButton
        title={`Upload ${documentType.replace(/_/g, ' ')}`}
        loading={busy}
        onPress={() => {
          void upload();
        }}
      />
      <FlowError message={error} />
      <Text style={flowStyles.body}>{message}</Text>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading documents" />
      ) : documents.length === 0 && !error ? (
        <Text style={flowStyles.body}>
          No verification documents uploaded yet.
        </Text>
      ) : null}
      {documents.map(doc => (
        <Pressable
          accessibilityRole="button"
          key={doc.id}
          disabled={busy}
          style={flowStyles.option}
          onPress={() => {
            if (DOCUMENT_TYPES.includes(doc.documentType as StaffDocumentType))
              setDocumentType(doc.documentType as StaffDocumentType);
          }}
        >
          <Text style={flowStyles.label}>
            {doc.documentType.replace(/_/g, ' ')} — {doc.verificationStatus}
          </Text>
          <Text style={flowStyles.body}>
            {new Date(doc.uploadedAt).toLocaleDateString()}
            {doc.verificationStatus === 'REJECTED'
              ? ' · Select to upload a corrected replacement.'
              : ''}
          </Text>
        </Pressable>
      ))}
      <FlowButton
        title="Refresh documents and status"
        disabled={busy || loading}
        onPress={() => {
          void load();
          void access.refresh();
        }}
      />
    </FlowForm>
  );
}
