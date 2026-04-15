-- Allow network_manager to update all profiles (like admin)
CREATE POLICY "Network managers can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'network_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));

-- Allow network_manager to create/update incidents
CREATE POLICY "Network managers can create incidents"
ON public.incidents
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));

CREATE POLICY "Network managers can update incidents"
ON public.incidents
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'network_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));

-- Allow network_manager to create/update clients
CREATE POLICY "Network managers can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));

CREATE POLICY "Network managers can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'network_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));

-- Allow network_manager to create incident notes
CREATE POLICY "Network managers can create notes"
ON public.incident_notes
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));

-- Allow network_manager to create incident history
CREATE POLICY "Network managers can create history"
ON public.incident_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'network_manager'::app_role));