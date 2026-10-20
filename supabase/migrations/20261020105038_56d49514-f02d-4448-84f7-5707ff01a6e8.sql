DROP POLICY IF EXISTS "Admins can manage SLA policies" ON public.sla_policies;
CREATE POLICY "Admins and managers manage SLA policies" ON public.sla_policies FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'network_manager'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'network_manager'));
DROP POLICY IF EXISTS "Admins and tech managers manage tech sla policies" ON public.tech_sla_policies;
CREATE POLICY "Admins and managers manage tech sla policies" ON public.tech_sla_policies FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'network_manager'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'network_manager'));