import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ordersAPI, shopAPI } from '../api';
import Invoice from '../components/Invoice';
import LoadingSpinner from '../components/LoadingSpinner';

const OrderInvoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [orderRes, shopRes] = await Promise.all([
          ordersAPI.getOne(id),
          shopAPI.getInfo(),
        ]);
        setOrder(orderRes.data.data);
        setShop(shopRes.data.data);
      } catch {
        /* handled by interceptor */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <Link to="/orders" className="btn-secondary inline-flex">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>
      <Invoice order={order} shop={shop} />
    </div>
  );
};

export default OrderInvoice;
