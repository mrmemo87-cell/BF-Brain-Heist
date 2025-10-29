
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const ShopPage: React.FC = () => {
  return (
    <div className="space-y-4">
        <h1 className="text-3xl font-heading text-[hsl(var(--primary))]">Shop</h1>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Premium items and special offers will be available here. Check back later, agent.</p>
            </CardContent>
        </Card>
    </div>
  );
};

export default ShopPage;


